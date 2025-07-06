import json
from datetime import datetime

from app.core.config import bucket_name, women_team_info
from app.db.gcs import client as gcs_client
from app.services import api_client, stats_calculator

BUCKET_NAME = bucket_name
WOMEN_TEAM_INFO = women_team_info


def process_all_teams():
    """Orchestrates the data processing for all teams."""
    for team_id, team_info in WOMEN_TEAM_INFO.items():
        team_name = team_info["name"]
        print(f"Processing team: {team_name} ({team_id})")
        process_team(team_id)
        break
    return {"message": "All teams processed successfully."}


def process_team(team_id: int):
    """Processes a single team, using caching to avoid redundant work."""
    # 1. Get the current state from the API
    live_match_ids = sorted(api_client.get_completed_match_ids(team_id))
    team_name = women_team_info[team_id]["name"]

    if not live_match_ids:
        print(f"No completed matches found for team {team_name}. Skipping.")
        return

    # 2. Check against the cached manifest
    manifest_path = f"calculated_data/{team_id}/manifest.json"
    manifest = gcs_client.download_json(BUCKET_NAME, manifest_path)

    if manifest and sorted(manifest.get("processed_match_ids", [])) == live_match_ids:
        print(f"Team {team_name} is already up-to-date. No new games found. Skipping.")
        return

    print(f"New data found for team {team_name}. Proceeding with calculation.")

    # 3. Sync raw data cache
    all_games_data = sync_raw_data_cache(team_id, live_match_ids)

    # 4. Perform calculations
    res = stats_calculator.get_team_advanced_stats(None, all_games_data)
    team_adv_stats = res["adv_stats"]
    total_team_stats = res["team_totals"]

    all_team_stats = {
        team_id: {
            "team_info": WOMEN_TEAM_INFO[team_id],
            "adv_stats": team_adv_stats,
            "team_totals": total_team_stats,
        }
    }

    # Calculate Player stats
    all_player_stats = {}
    rosters = api_client.get_rosters(team_id)
    for roster in rosters:
        roster_id = roster["id"]
        division_stats = api_client.fetch_player_division_stats(roster_id)
        player_stats = stats_calculator.get_player_advanced_stats(
            roster_id, all_games_data, total_team_stats, division_stats
        )

        if "error" in player_stats:
            print(player_stats["error"])
            continue

        # store stats
        personalInfo = roster["personalInfo"]
        personalInfo["position"] = roster["position"]
        personalInfo["jerseyNumber"] = roster["jerseyNumber"]
        personalInfo["squad_id"] = team_id

        all_player_stats[roster_id] = {
            "personalInfo": personalInfo,
            "adv_stats": player_stats["player_adv_stats"],
            "player_totals": player_stats["player_totals"],
            "team_totals": player_stats["team_totals"],
        }

    # 5. Transform and upload final reports
    # all_team_stats_list, all_player_stats_list, teams_list = stats_calculator.transform_data(all_team_stats, all_player_stats)
    # gcs_client.upload_json(
    #     BUCKET_NAME, f"calculated_data/{team_id}/team_stats.json", all_team_stats
    # )
    # gcs_client.upload_json(
    #     BUCKET_NAME, f"calculated_data/{team_id}/player_stats.json", all_player_stats
    # )
    # gcs_client.upload_json(BUCKET_NAME, "teams.json", teams_list)

    # 6. Update the manifest
    new_manifest = {
        "last_updated": datetime.now(),
        "processed_match_ids": live_match_ids,
    }
    with open(f"./json/{team_id}/all_team_stats.json", "w") as f:
        json.dump(all_team_stats, f, indent=4)

    with open(f"./json/{team_id}/player_stats.json", "w") as f:
        json.dump(all_player_stats, f, indent=4)
    # gcs_client.upload_json(BUCKET_NAME, manifest_path, new_manifest)
    print(f"Successfully processed and updated cache for team {team_name}.")


def sync_raw_data_cache(team_id, live_match_ids: list[int]) -> dict:
    """Ensures all raw game data is cached in GCS and returns it."""
    all_games_data = {}
    raw_data_prefix = "raw_data/"
    cached_blobs = gcs_client.list_blobs(BUCKET_NAME, raw_data_prefix)
    cached_ids = {int(blob.split("/")[1].split(".")[0]) for blob in cached_blobs}

    missing_ids = set(live_match_ids) - cached_ids

    for match_id in missing_ids:
        print(f"Fetching and caching new game: {match_id}")
        game_data = api_client.fetch_game_data(match_id)
        if game_data:
            gcs_client.upload_json(
                BUCKET_NAME, f"{raw_data_prefix}{match_id}.json", game_data
            )
            all_games_data[match_id] = _transform_raw_game_data(game_data, team_id)

    # Load existing data
    for match_id in cached_ids:
        if match_id in live_match_ids:
            print(f"Downloading stats of match id {match_id}")
            data = gcs_client.download_json(
                BUCKET_NAME, f"{raw_data_prefix}{match_id}.json"
            )
            if data:
                all_games_data[match_id] = _transform_raw_game_data(data, team_id)
    # transformed_games_data = {}
    # for match_id, game_data in all_games_data.items():
    #     transformed_games_data[match_id] = _transform_raw_game_data(game_data, team_id)

    return all_games_data


def _transform_raw_game_data(raw_game_data: dict, team_id: int) -> dict:
    """
    Transforms raw game data into a structured format for calculations.
    """
    game_stats = {"team_stats": {}, "opponent_stats": {}, "player_stats": {}}

    # --- Team & Opponent Stats ---
    for squad in raw_game_data["squads"]:
        stats = squad["stats"]["accumulatedStats"]
        target = "team_stats" if squad["squadId"] == team_id else "opponent_stats"
        game_stats[target] = stats
        # Adjust offensive and defensive rebounds based on the notebook's logic
        game_stats[target]["squadOffensiveRebounds"] = (
            game_stats[target]["offensiveRebounds"]
            - game_stats[target]["squadOffensiveRebounds"]
        )
        game_stats[target]["squadDefensiveRebounds"] = (
            game_stats[target]["defensiveRebounds"]
            - game_stats[target]["squadDefensiveRebounds"]
        )

    # --- Player Stats ---
    for roster in raw_game_data.get("rosters", []):
        if roster.get("squadId") == team_id:
            roster_id = roster["rosterId"]
            stats = roster["stats"]["accumulatedStats"]

            # Only add player if they played
            if stats.get("timeOnCourt", 0) > 0:
                game_stats["player_stats"][roster_id] = stats

    return game_stats
