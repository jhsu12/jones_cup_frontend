import requests


def get_completed_match_ids(team_id: int) -> list[int]:
    """Fetches a list of completed match IDs for a given team."""
    url = f"https://jonescup.meetagile.com/api/squad-team-squads/{team_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        match_ids = []
        for match in data.get("matches", []):
            if match.get("status") == "COMPLETED":
                match_ids.append(match["id"])
        return match_ids
    except requests.exceptions.RequestException as e:
        print(f"Error fetching match IDs for team {team_id}: {e}")
        return []


def get_rosters(team_id: int) -> list[dict]:
    """Fetches the roster for a given team."""
    url = f"https://jonescup.meetagile.com/api/squad-team-squads/{team_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return data.get("rosters", [])
    except requests.exceptions.RequestException as e:
        print(f"Error fetching roster for team {team_id}: {e}")
        return []


def fetch_player_division_stats(roster_id: int) -> dict | None:
    """Fetches the division stats for a single player."""
    url = f"https://jonescup.meetagile.com/api/roster-division-basketball-stats/{roster_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        # The API returns a list, we want the first element
        return data[0] if data else None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching division stats for roster {roster_id}: {e}")
        return None


def fetch_game_data(match_id: int) -> dict | None:
    """Fetches the raw JSON data for a single match."""
    url = f"https://jonescup.meetagile.com/api/match-basketball-stats/{match_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data for match {match_id}: {e}")
        return None
