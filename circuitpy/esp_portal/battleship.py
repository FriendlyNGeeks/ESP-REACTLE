# battleship.py
# CircuitPython + adafruit_httpserver.Websocket
# Robust Dots & Boxes manager with deferred initial send and safe polling.

import json

class Battleship:
    # Live sockets + sockets that need their first state send on next poll
    ws_clients = set()
    ws_needs_init = set()
    _instance = None

    def __init__(self):
        self.BOARD_SIZE = 8
        self.BOXES_SIZE = self.BOARD_SIZE - 1
        # board[r][c] = [hOwner, vOwner]; owners are 0|1|2
        self.game_state = {
            "board": [[[0, 0] for _ in range(self.BOARD_SIZE)] for _ in range(self.BOARD_SIZE)],
            "boxes": [[0 for _ in range(self.BOXES_SIZE)] for _ in range(self.BOXES_SIZE)],
            "scores": {1: 0, 2: 0},
            "currentPlayer": 1,
            "winner": 0,
        }

    # ---------- singleton ----------
    @classmethod
    def _get_instance(cls):
        if cls._instance is None:
            cls._instance = Battleship()
        return cls._instance

    # ---------- websocket lifecycle ----------
    @classmethod
    def handle_ws(cls, ws):
        """
        Called from route after creating Websocket(request).
        We don't send immediately—some stacks will drop a frame
        sent in the same handler. We queue it for the next poll().
        """
        cls._get_instance()  # ensure instance exists
        cls.ws_clients.add(ws)
        cls.ws_needs_init.add(ws)  # send state on next poll tick

    @classmethod
    def on_disconnect(cls, ws):
        if ws in cls.ws_clients:
            cls.ws_clients.discard(ws)
        if ws in cls.ws_needs_init:
            cls.ws_needs_init.discard(ws)

    # ---------- main poll loop ----------
    @classmethod
    def poll(cls):
        """
        Call from the main server loop (after server.poll()).
        - Sends initial state to new sockets.
        - Reads any inbound frames and applies moves.
        - Broadcasts state after changes.
        """
        inst = cls._get_instance()

        # 1) Send initial state to sockets that just upgraded
        if cls.ws_needs_init:
            dead = []
            for ws in tuple(cls.ws_needs_init):
                try:
                    payload = {"type": "state"}
                    payload.update(inst.game_state)
                    payload["count"] = len(cls.ws_clients) - 1  # exclude dashboard
                    ws.send_message(json.dumps(payload))
                except Exception:
                    dead.append(ws)
                finally:
                    # either way, don't try to init twice
                    cls.ws_needs_init.discard(ws)
            for ws in dead:
                try:
                    ws.close()
                except Exception:
                    pass
                cls.ws_clients.discard(ws)

        # 2) Service all active sockets
        for ws in tuple(cls.ws_clients):
            # Read one frame (non-blocking; returns None if none)
            try:
                msg = ws.receive()
            except Exception:
                # Treat read errors as disconnects
                try:
                    ws.close()
                except Exception:
                    pass
                cls.on_disconnect(ws)
                continue

            if not msg:
                # No frame available (None or empty string); next socket
                continue

            # Process message safely
            changed = False
            try:
                data = json.loads(msg)
            except Exception:
                data = None

            if not isinstance(data, dict):
                # Unknown/invalid frame
                continue

            mtype = data.get("type")

            if mtype == "ping":
                # Optional: could reply with pong; not required on LAN
                continue

            if mtype == "reset":
                inst._reset_game()
                changed = True

            elif mtype == "join":
                # Client announces preferred player; state doesn't change here.
                # You can enforce one-socket-per-player if desired.
                # We still rebroadcast so UIs can reflect connection counts.
                changed = True

            else:
                # Accept both schemas:
                # A) {player,row,col,orientation:"h"|"v"}
                # B) {type:"move", t:"h"|"v", r:int, c:int, player?:int}
                t = data.get("orientation");  r = data.get("row");  c = data.get("col")
                if t is None: t = data.get("t")
                if r is None: r = data.get("r")
                if c is None: c = data.get("c")
                player = data.get("player")
                if player is None:
                    player = inst.game_state.get("currentPlayer", 1)

                if isinstance(r, int) and isinstance(c, int) and t in ("h","v") and player in (1,2):
                    if inst._apply_move(player, t, r, c):
                        changed = True

            if changed:
                inst._broadcast_state()

    # ---------- game logic ----------
    def _reset_game(self):
        self.game_state["board"] = [[[0, 0] for _ in range(self.BOARD_SIZE)] for _ in range(self.BOARD_SIZE)]
        self.game_state["boxes"] = [[0 for _ in range(self.BOXES_SIZE)] for _ in range(self.BOXES_SIZE)]
        self.game_state["scores"] = {1: 0, 2: 0}
        self.game_state["currentPlayer"] = 1
        self.game_state["winner"] = 0

    def _apply_move(self, player, t, row, col):
        """
        Returns True if state changed (move accepted), else False.
        """
        # Only allow current player
        if player != self.game_state["currentPlayer"]:
            return False

        board = self.game_state["board"]
        boxes = self.game_state["boxes"]
        scores = self.game_state["scores"]

        claimed_box = False

        if t == "h":
            # Horizontal edge: row in [0..BOARD_SIZE-1], col in [0..BOXES_SIZE-1]
            if not (0 <= row < self.BOARD_SIZE and 0 <= col < self.BOXES_SIZE):
                return False
            if board[row][col][0] != 0:
                return False
            board[row][col][0] = player

            # Boxes above / below
            if row > 0 and self._is_box_complete(row - 1, col):
                boxes[row - 1][col] = player
                scores[player] += 1
                claimed_box = True
            if row < self.BOXES_SIZE and self._is_box_complete(row, col):
                boxes[row][col] = player
                scores[player] += 1
                claimed_box = True

        elif t == "v":
            # Vertical edge: row in [0..BOXES_SIZE-1], col in [0..BOARD_SIZE-1]
            if not (0 <= row < self.BOXES_SIZE and 0 <= col < self.BOARD_SIZE):
                return False
            if board[row][col][1] != 0:
                return False
            board[row][col][1] = player

            # Boxes left / right
            if col > 0 and self._is_box_complete(row, col - 1):
                boxes[row][col - 1] = player
                scores[player] += 1
                claimed_box = True
            if col < self.BOXES_SIZE and self._is_box_complete(row, col):
                boxes[row][col] = player
                scores[player] += 1
                claimed_box = True

        # Winner?
        total_boxes = self.BOXES_SIZE * self.BOXES_SIZE
        if scores[1] + scores[2] == total_boxes:
            if scores[1] > scores[2]:
                self.game_state["winner"] = 1
            elif scores[2] > scores[1]:
                self.game_state["winner"] = 2
            else:
                self.game_state["winner"] = 0

        # Turn swap only if no box was claimed
        if not claimed_box:
            self.game_state["currentPlayer"] = 2 if player == 1 else 1

        return True

    def _is_box_complete(self, row, col):
        # All four edges around boxes[row][col] must be set
        try:
            b = self.game_state["board"]
            return (
                b[row][col][0] != 0 and          # top
                b[row + 1][col][0] != 0 and      # bottom
                b[row][col][1] != 0 and          # left
                b[row][col + 1][1] != 0          # right
            )
        except Exception:
            return False

    # ---------- broadcast ----------
    def _broadcast_state(self):
        payload = {"type": "state"}
        payload.update(self.game_state)
        payload["count"] = len(self.ws_clients) - 1  # exclude dashboard
        data = json.dumps(payload)

        dead = []
        for ws in tuple(self.ws_clients):
            try:
                ws.send_message(data)
            except Exception:
                dead.append(ws)

        for ws in dead:
            try:
                ws.close()
            except Exception:
                pass
            self.ws_clients.discard(ws)
