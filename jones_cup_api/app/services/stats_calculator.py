from collections import Counter

from app.core.config import women_team_info

WOMEN_TEAM_INFO = women_team_info


def transform_data(all_team_stats, all_player_stats):

    all_team_stats_list = []
    for team_id, stats in all_team_stats.items():
        adv_stats = stats["adv_stats"]
        team_totals = stats["team_totals"]

        # Calculate shot data
        two_pointers_attempted = team_totals.get(
            "fieldGoalsAttempted", 0
        ) - team_totals.get("threePointersAttempted", 0)
        paint_attempt = team_totals.get("pointsInPaint", 0) / 2  # Approximation
        mid_range_attempt = two_pointers_attempted - paint_attempt

        team_data = {
            "team_id": team_id,
            "team_name": women_team_info[team_id]["name"],
            "logo_path": women_team_info[team_id]["logoUrl"],
            "ORtg": adv_stats.get("OffensiveRating", 0),
            "DRtg": adv_stats.get("DefensiveRating", 0),
            "Pace": adv_stats.get("Pace", 0),
            "O_eFG_PCT": adv_stats.get("eFG", 0),
            "O_TOV_PCT": adv_stats.get("TOV", 0),
            "O_ORB_PCT": adv_stats.get("ORP", 0),
            "O_FT_FGA": adv_stats.get("FTR", 0),
            "ShotData": {
                "MidRangeAttempt": mid_range_attempt,
                "PaintAttempt": paint_attempt,
                "3PAttempt": team_totals.get("threePointersAttempted", 0),
            },
        }
        all_team_stats_list.append(team_data)

    all_player_stats_list = []
    for player_name, stats in all_player_stats.items():
        adv_stats = stats.get("adv_stats", {})
        player_data = {
            "personalInfo": stats.get("personalInfo", {}),
            "GP": adv_stats.get("GP", 0),
            "USG_PCT": adv_stats.get("USG%", 0),
            "TS_PCT": adv_stats.get("TS%", 0),
            "AST_PCT": adv_stats.get("AST%", 0),
            "REB_PCT": adv_stats.get("TREB%", 0),
        }
        all_player_stats_list.append(player_data)

    return (
        all_team_stats_list,
        all_player_stats_list,
    )


def calculate_team_advanced_stats(data):
    team_stats = dict()

    # main team
    team_stats["OffensiveRating"] = (
        data["score"] / data["possessions"] * 100 if data["possessions"] > 0 else 0
    )
    team_stats["DefensiveRating"] = (
        data["Op-score"] / data["Op-possessions"] * 100
        if data["Op-possessions"] > 0
        else 0
    )
    team_stats["NetRating"] = (
        team_stats["OffensiveRating"] - team_stats["DefensiveRating"]
    )
    team_stats["Pace"] = (
        40
        * (
            (data["possessions"] + data["Op-possessions"])
            / (2 * (data["teamMinutesPlayed"] / 5))
        )
        if data["teamMinutesPlayed"] > 0
        else 0
    )

    # four factors main team
    team_stats["eFG"] = (
        (data["fieldGoalsMade"] + 0.5 * data["threePointersMade"])
        / data["fieldGoalsAttempted"]
        if data["fieldGoalsAttempted"] > 0
        else 0
    )
    team_stats["TOV"] = (
        data["turnovers"] / (data["possessions"] + data["squadOffensiveRebounds"])
        if data["possessions"] > 0
        else 0
    )
    team_stats["ORP"] = (
        data["squadOffensiveRebounds"]
        / (data["squadOffensiveRebounds"] + data["Op-squadDefensiveRebounds"])
        if (data["squadOffensiveRebounds"] + data["Op-squadDefensiveRebounds"]) > 0
        else 0
    )
    team_stats["FTR"] = (
        data["freeThrowsAttempted"] / data["fieldGoalsAttempted"]
        if data["fieldGoalsAttempted"] > 0
        else 0
    )

    # four factors opponent team
    team_stats["Op-eFG"] = (
        (data["Op-fieldGoalsMade"] + 0.5 * data["Op-threePointersMade"])
        / data["Op-fieldGoalsAttempted"]
        if data["Op-fieldGoalsAttempted"] > 0
        else 0
    )
    team_stats["Op-TOV"] = (
        data["Op-turnovers"]
        / (data["Op-possessions"] + data["Op-squadOffensiveRebounds"])
        if data["Op-possessions"] > 0
        else 0
    )
    team_stats["Op-ORP"] = (
        data["Op-squadOffensiveRebounds"]
        / (data["Op-squadOffensiveRebounds"] + data["squadDefensiveRebounds"])
        if (data["Op-squadOffensiveRebounds"] + data["squadDefensiveRebounds"]) > 0
        else 0
    )
    team_stats["Op-FTR"] = (
        data["Op-freeThrowsAttempted"] / data["Op-fieldGoalsAttempted"]
        if data["Op-fieldGoalsAttempted"] > 0
        else 0
    )

    return team_stats


def get_team_advanced_stats(player_id, all_games_data):
    """
    Calculates team advanced stats by first accumulating totals from all games.
    """
    games_data = all_games_data

    def sum_stat(all_games_data, source_key, stat_key):
        """Helper function to sum a specific stat from the game data."""
        return sum(g[source_key].get(stat_key, 0) for g in all_games_data.values())

    # Caluclate the team stats onlt this player id played
    if isinstance(player_id, int):
        player_games = [
            match_id
            for match_id, game in all_games_data.items()
            if player_id in game.get("player_stats", {})
        ]
        if len(player_games) != len(all_games_data):
            games_data = {k: all_games_data[k] for k in player_games}

    # List of stats that are simple sums
    stat_keys = [
        "fieldGoalsMade",
        "wonScore",
        "fieldGoalsAttempted",
        "threePointersMade",
        "threePointersAttempted",
        "freeThrowsAttempted",
        "turnovers",
        "squadOffensiveRebounds",
        "squadDefensiveRebounds",
        "fastBreakPoints",
        "pointsOffTurnovers",
        "secondChancePoints",
        "benchPoints",
        "largestLead",
        "largestScoringRun",
        "leadChanges",
        "pointsInPaint",
    ]
    # --- Build the dictionary cleanly ---
    team_totals = {}

    # Calculate stats for your team
    for key in stat_keys:
        team_totals[key] = sum_stat(games_data, "team_stats", key)

    # Calculate stats for the opponent
    for key in stat_keys:
        team_totals[f"Op-{key}"] = sum_stat(games_data, "opponent_stats", key)

    # Handle the special cases like totalMinutes separately
    team_totals["teamMinutesPlayed"] = (
        sum_stat(games_data, "team_stats", "timeOnCourt") / 60
    )
    team_totals["Op-teamMinutesPlayed"] = (
        sum_stat(games_data, "opponent_stats", "timeOnCourt") / 60
    )

    # Calculate Possesion
    team_totals["possessions"] = (
        team_totals["fieldGoalsAttempted"]
        + team_totals["turnovers"]
        + 0.44 * team_totals["freeThrowsAttempted"]
        - team_totals["squadOffensiveRebounds"]
    )
    team_totals["Op-possessions"] = (
        team_totals["Op-fieldGoalsAttempted"]
        + team_totals["Op-turnovers"]
        + 0.44 * team_totals["Op-freeThrowsAttempted"]
        - team_totals["Op-squadOffensiveRebounds"]
    )
    # Rename 'wonScore' to 'score' for clarity
    team_totals["score"] = team_totals.pop("wonScore")
    team_totals["Op-score"] = team_totals.pop("Op-wonScore")

    # Shot data for team
    team_totals["two_pointers_attempted"] = team_totals.get(
        "fieldGoalsAttempted", 0
    ) - team_totals.get("threePointersAttempted", 0)
    team_totals["paint_attempt"] = (
        team_totals.get("pointsInPaint", 0) / 2
    )  # Approximation
    team_totals["mid_range_attempt"] = (
        team_totals["two_pointers_attempted"] - team_totals["paint_attempt"]
    )

    # Now calculate advanced stats from the accumulated totals
    team_adv_stats = f"Calculating team total stats for player_id : {player_id}"
    if not isinstance(player_id, int):
        team_adv_stats = calculate_team_advanced_stats(team_totals)

    # For now, returning a placeholder
    return {
        "message": "Team stats calculated here.",
        "total_games": len(all_games_data),
        "adv_stats": team_adv_stats,
        "team_totals": team_totals,
    }


def calculate_player_total_stats(player_id, all_games_data):
    """
    Calculates advanced stats for a single player.
    """
    player_games = {
        match_id: game
        for match_id, game in all_games_data.items()
        if player_id in game["player_stats"]
    }

    if not player_games:
        return {"error": "Player did not play in any completed games."}

    # --- Use the Counter method to get all total stats ---
    total_stats_counter = Counter()
    for game in player_games.values():
        total_stats_counter.update(game["player_stats"][player_id])

    # This dictionary now holds all the summed stats
    total_stats = dict(total_stats_counter)
    total_stats["matchCount"] = len(player_games)

    return total_stats  # Or return a new dict with the advanced stats


def calculate_player_advanced_stats(
    player_MP: float, team_totals: dict, division_stats: dict
) -> dict:
    """
    Calculates advanced stats for a single player.
    """
    player_stats = dict()

    if not division_stats:
        return {}

    MP = player_MP

    TmTOV = team_totals["turnovers"]
    TmMP = team_totals["teamMinutesPlayed"]
    TmFGM = team_totals["fieldGoalsMade"]
    TmFGA = team_totals["fieldGoalsAttempted"]
    TmFTA = team_totals["freeThrowsAttempted"]

    TmORB = team_totals["squadOffensiveRebounds"]
    TmDRB = team_totals["squadDefensiveRebounds"]
    TmTRB = TmORB + TmDRB

    OppORB = team_totals["Op-squadOffensiveRebounds"]
    OppDRB = team_totals["Op-squadDefensiveRebounds"]
    OppTRB = OppORB + OppDRB

    stats = division_stats["stats"]
    matchCount = stats["matchCount"]
    average_stats = stats["averageStats"]
    percentage_stats = stats["percentageStats"]

    player_stats["GP"] = stats["matchCount"]
    player_stats["MP"] = MP
    player_stats["average-points"] = average_stats["score"]
    player_stats["average-assists"] = average_stats["assists"]
    player_stats["average-rebounds"] = average_stats["rebounds"]
    player_stats["average-steals"] = average_stats["steals"]
    player_stats["average-blocks"] = average_stats["blocks"]
    player_stats["average-turnovers"] = average_stats["turnovers"]

    player_stats["3P%"] = percentage_stats["threePointersPercentage"] * 100
    player_stats["FT%"] = percentage_stats["freeThrowsPercentage"] * 100
    player_stats["FG%"] = percentage_stats["fieldGoalsPercentage"] * 100
    player_stats["eFG%"] = percentage_stats["effectiveFieldGoalsPercentage"] * 100
    player_stats["TS%"] = percentage_stats["trueShootingPercentage"] * 100

    player_stats["2PA"] = average_stats["twoPointersAttempted"] * matchCount
    player_stats["2PM"] = average_stats["twoPointersMade"] * matchCount
    player_stats["twoPointersPercentage"] = (
        player_stats["2PM"] / player_stats["2PA"] * 100
        if player_stats["2PA"] != 0
        else 0
    )

    player_stats["3PA"] = average_stats["threePointersAttempted"] * matchCount
    player_stats["FTA"] = average_stats["freeThrowsAttempted"] * matchCount
    player_stats["AST"] = average_stats["assists"] * matchCount
    player_stats["FGM"] = average_stats["fieldGoalsMade"] * matchCount
    player_stats["FGA"] = average_stats["fieldGoalsAttempted"] * matchCount
    player_stats["TOV"] = average_stats["turnovers"] * matchCount
    player_stats["OREB"] = average_stats["offensiveRebounds"] * matchCount
    player_stats["DREB"] = average_stats["defensiveRebounds"] * matchCount
    player_stats["TREB"] = player_stats["OREB"] + player_stats["DREB"]

    allAttempts = player_stats["2PA"] + player_stats["3PA"] + player_stats["FTA"]
    player_stats["2PA%"] = (
        player_stats["2PA"] / allAttempts * 100 if allAttempts > 0 else 0
    )
    player_stats["3PA%"] = (
        player_stats["3PA"] / allAttempts * 100 if allAttempts > 0 else 0
    )
    player_stats["FTA%"] = (
        player_stats["FTA"] / allAttempts * 100 if allAttempts > 0 else 0
    )
    player_stats["AST/TOV"] = (
        player_stats["AST"] / player_stats["TOV"] if player_stats["TOV"] != 0 else 0
    )
    ast_denominator = ((MP / (TmMP / 5)) * TmFGM) - player_stats["FGM"]
    player_stats["AST%"] = (
        100 * player_stats["AST"] / ast_denominator if ast_denominator != 0 else 0
    )
    oreb_denominator = MP * (TmORB + OppDRB)
    player_stats["OREB%"] = (
        100 * (player_stats["OREB"] * (TmMP / 5)) / oreb_denominator
        if oreb_denominator != 0
        else 0
    )
    dreb_denominator = MP * (TmDRB + OppORB)
    player_stats["DREB%"] = (
        100 * (player_stats["DREB"] * (TmMP / 5)) / dreb_denominator
        if dreb_denominator != 0
        else 0
    )
    treb_denominator = MP * (TmTRB + OppTRB)
    player_stats["TREB%"] = (
        100 * (player_stats["TREB"] * (TmMP / 5)) / treb_denominator
        if treb_denominator != 0
        else 0
    )
    usg_denominator = MP * (TmFGA + 0.44 * TmFTA + TmTOV)
    player_stats["USG%"] = (
        100
        * (
            (player_stats["FGA"] + 0.44 * player_stats["FTA"] + player_stats["TOV"])
            * (TmMP / 5)
        )
        / usg_denominator
        if usg_denominator != 0
        else 0
    )
    return player_stats


def get_player_advanced_stats(
    player_id, all_games_data, total_team_stats, division_stats
):
    """
    Calculates advanced stats, using pre-calculated team totals if the
    player participated in all games.
    """
    player_games_dict = {
        match_id: game
        for match_id, game in all_games_data.items()
        if player_id in game.get("player_stats", {})
    }

    if not player_games_dict:
        return {"error": f"Player {player_id} did not play in any completed games."}

    # --- New Conditional Logic ---
    # Check if the player's game count matches the team's total game count.
    team_totals_for_player = dict()
    if len(player_games_dict) == len(all_games_data):
        # If yes, use the efficient pre-calculated total team stats.
        team_totals_for_player = total_team_stats
    else:
        # If no, calculate the team stats from only the games the player played.
        res = get_team_advanced_stats(player_id, all_games_data)
        team_totals_for_player = res["team_totals"]
    # print(team_totals_for_player)

    # --- The rest of the calculation remains the same ---
    player_totals = calculate_player_total_stats(player_id, player_games_dict)

    player_MP = player_totals["timeOnCourt"] / 60
    player_adv_stats = calculate_player_advanced_stats(
        player_MP, team_totals_for_player, division_stats
    )

    return {
        "team_totals": team_totals_for_player,
        "player_totals": player_totals,
        "player_adv_stats": player_adv_stats,
    }
