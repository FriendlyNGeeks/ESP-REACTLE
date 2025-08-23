import time
import json

class DotsAndBoxesGame:
    ws_clients = set()

    def __init__(self):
        self.BOARD_SIZE = 8
        self.BOXES_SIZE = self.BOARD_SIZE - 1
        self.game_state = {
            "board": [[[0, 0] for _ in range(self.BOARD_SIZE)] for _ in range(self.BOARD_SIZE)],  # 8x8 grid for lines
            "boxes": [[0 for _ in range(self.BOXES_SIZE)] for _ in range(self.BOXES_SIZE)],      # 7x7 boxes
            "scores": {1: 0, 2: 0},
            "currentPlayer": 1,
            "winner": 0,
        }

    @classmethod
    def handle_ws(cls, ws):
        cls.ws_clients.add(ws)
        print("Dots and Boxes WS client Connection:", len(cls.ws_clients))
        try:
            # Send initial state from the singleton instance, including count
            if hasattr(cls, '_instance'):
                print("Sending initial game state to new client")
                state_with_count = dict(cls._instance.game_state)
                state_with_count["count"] = len(cls.ws_clients)
                ws.send_message(json.dumps(state_with_count))
        except Exception:
            pass
        
    @classmethod
    def poll(cls):
        # Call this in your main loop
        if not hasattr(cls, '_instance'):
            cls._instance = DotsAndBoxesGame()
        instance = cls._instance
        for ws in tuple(cls.ws_clients):
            try:
                msg = ws.receive(fail_silently=True)
                if msg:
                    instance.process_move(msg)
            except Exception:
                try:
                    ws.close()
                except Exception:
                    pass
                cls.ws_clients.discard(ws)

    def broadcast_state(self):
        # Add player count to the outgoing message
        state_with_count = dict(self.game_state)
        state_with_count["count"] = len(self.ws_clients)
        payload = json.dumps(state_with_count)
        dead = []
        for ws in tuple(self.ws_clients):
            try:
                ws.send_message(payload, fail_silently=False)
            except Exception:
                dead.append(ws)
        for ws in dead:
            try:
                ws.close()
            except Exception:
                pass
            self.ws_clients.discard(ws)

    def process_move(self, msg):
        try:
            move = json.loads(msg)
            player = move.get("player")
            row = move.get("row")
            col = move.get("col")
            orientation = move.get("orientation")
            if player not in (1, 2):
                return
            if orientation not in ("h", "v"):
                return
            # Validate bounds
            if not (0 <= row < self.BOARD_SIZE and 0 <= col < self.BOARD_SIZE):
                return
            # Only allow current player
            if player != self.game_state["currentPlayer"]:
                return

            board = self.game_state["board"]
            boxes = self.game_state["boxes"]
            scores = self.game_state["scores"]
            claimed_box = False

            # Place the line if not already claimed
            if orientation == "h":
                if col >= self.BOXES_SIZE or row >= self.BOARD_SIZE:
                    return
                if board[row][col][0] != 0:
                    return
                board[row][col][0] = player
                # Check for completed boxes above and below
                if row > 0:
                    if self._is_box_complete(row-1, col):
                        boxes[row-1][col] = player
                        scores[player] += 1
                        claimed_box = True
                if row < self.BOXES_SIZE:
                    if self._is_box_complete(row, col):
                        boxes[row][col] = player
                        scores[player] += 1
                        claimed_box = True
            elif orientation == "v":
                if row >= self.BOXES_SIZE or col >= self.BOARD_SIZE:
                    return
                if board[row][col][1] != 0:
                    return
                board[row][col][1] = player
                # Check for completed boxes left and right
                if col > 0:
                    if self._is_box_complete(row, col-1):
                        boxes[row][col-1] = player
                        scores[player] += 1
                        claimed_box = True
                if col < self.BOXES_SIZE:
                    if self._is_box_complete(row, col):
                        boxes[row][col] = player
                        scores[player] += 1
                        claimed_box = True

            # Check for winner
            total_boxes = self.BOXES_SIZE * self.BOXES_SIZE
            if scores[1] + scores[2] == total_boxes:
                if scores[1] > scores[2]:
                    self.game_state["winner"] = 1
                elif scores[2] > scores[1]:
                    self.game_state["winner"] = 2
                else:
                    self.game_state["winner"] = 0

            # Switch player if no box was claimed
            if not claimed_box:
                self.game_state["currentPlayer"] = 2 if player == 1 else 1

            self.broadcast_state()
        except Exception as e:
            print("process_move error", e)
            pass

    def _is_box_complete(self, row, col):
        # Check if all four sides of a box are claimed
        try:
            b = self.game_state["board"]
            return (
                b[row][col][0] != 0 and  # top
                b[row+1][col][0] != 0 and  # bottom
                b[row][col][1] != 0 and  # left
                b[row][col+1][1] != 0    # right
            )
        except Exception:
            return False

