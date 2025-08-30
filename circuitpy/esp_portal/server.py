# --- server.py (patched) ---

import time, json, wifi, socketpool
from adafruit_httpserver import Server, Request, JSONResponse, Websocket, FileResponse, GET
from ._battleship import Battleship
from ._dots_and_boxes import DotsAndBoxes
from ._tic_tac_toe import TicTacToe
from ._rock_paper_scissors import RockPaperScissors

class ESPServer:
    def __init__(self, config=None, leaderboard=None):
        self.config = config
        self.leaderboard = leaderboard
        
        self.pool = socketpool.SocketPool(wifi.radio)
        self.server = Server(self.pool, root_path="/_www", debug=False)
        self.server.request_buffer_size = 2048

        # ---------- Routing ----------
        # Health ping
        @self.server.route("/api", GET)
        def api_route(request: Request):
            return JSONResponse(request, {"ok": True, "ip": str(wifi.radio.ipv4_address), "leaderboard": self.leaderboard.load()}), ""
        # Vite default assets location handling
        @self.server.route("/assets/<path:path>", GET)
        def assets(request: Request, path: str):
            return FileResponse(request, f"/assets/{path}")
        
        @self.server.route("/", GET)
        def home(request: Request):
            return FileResponse(request, "/index.html")
        @self.server.route("/battleship", GET)
        def route_battleship(request: Request):
            return FileResponse(request, "/index.html")
        
        @self.server.route("/dots-and-boxes", GET)
        def route_dnb_page(request: Request):
            return FileResponse(request, "/index.html")
        
        @self.server.route("/tic-tac-toe", GET)
        def route_ttt(request: Request):
            return FileResponse(request, "/index.html")
        
        @self.server.route("/r-p-s", GET)
        def route_rps(request: Request):
            return FileResponse(request, "/index.html")
        
        @self.server.route("/reactle", GET)
        def route_reactle(request: Request):
            return FileResponse(request, "/index.html")
        
        # ---------- Sockets ----------
        @self.server.route("/ws/battleship", GET)
        def ws_bat(request: Request):
            print("WS handshake from", request.client_address, "path=/ws/battleship")
            ws = Websocket(request)
            Battleship.handle_ws(ws)
            print("WS upgraded OK for", request.client_address)
            return ws
        
        @self.server.route("/ws/dots-and-boxes", GET)
        def ws_dnb(request: Request):
            print("WS handshake from", request.client_address, "path=/ws/dots-and-boxes")
            ws = Websocket(request)
            DotsAndBoxes.handle_ws(ws)
            print("WS upgraded OK for", request.client_address)
            return ws
        
        @self.server.route("/ws/rock-paper-scissors", GET)
        def ws_rps(request: Request):
            print("WS handshake from", request.client_address, "path=/ws/rock-paper-scissors")
            ws = Websocket(request)
            RockPaperScissors.handle_ws(ws)
            print("WS upgraded OK for", request.client_address)
            return ws
        
        @self.server.route("/ws/tic-tac-toe", GET)
        def ws_ttt(request: Request):
            print("WS handshake from", request.client_address, "path=/ws/tic-tac-toe")
            ws = Websocket(request)
            TicTacToe.handle_ws(ws)
            print("WS upgraded OK for", request.client_address)
            return ws
        # ---------- Pollables Games ----------
        self.pollables = [Battleship, DotsAndBoxes, RockPaperScissors, TicTacToe]

    def start(self):
        print("Starting ESP WebSocket server…")
        ip = str(wifi.radio.ipv4_address)
        self.server.start(ip, 80)
        print(f"HTTP/WS listening at: http://{ip}")

        while True:
            self.server.poll()           # service HTTP + WS handshakes
            for g in self.pollables:     # poll ALL games each tick
                g.poll()
            time.sleep(0.01)
