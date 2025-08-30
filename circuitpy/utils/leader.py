import json

class Leader_Board:
    def __init__(self, filename):
        self.filename = filename
        self.data = self.load()

    def load(self):
        try:
            with open(self.filename, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading leaderboard: {e}")
            return {}

    def save(self):
        with open(self.filename, "w") as f:
            json.dump(self.data, f)

    def try_add_score(self, game_key, initials, score):
        leaders = self.data[game_key]["LEADERS"]
        # Convert to a list of (rank, initials, score)
        scores = [
            (int(rank), entry["INITALS"], entry["SCORE"])
            for rank, entry in leaders.items()
        ]
        # Sort by score descending, then by rank
        scores.sort(key=lambda x: (-x[2], x[0]))
        # If the new score is higher than the lowest, insert it
        if score > scores[-1][2]:
            scores.append((0, initials, score))
            # Sort again and keep top 3
            scores = sorted(scores, key=lambda x: -x[2])[:3]
            # Rebuild the LEADERS dict
            for i, (rank, inits, sc) in enumerate(scores, 1):
                leaders[str(i)] = {"INITALS": inits, "SCORE": sc}
            self.save()
            return True  # Score was added
        return False  # Score was not high enough