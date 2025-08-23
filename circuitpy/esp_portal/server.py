# --- server.py (WebSocket-only) ---

import time, json, wifi, socketpool
from adafruit_httpserver import (
    Server, Request, JSONResponse, Websocket, FileResponse, GET
)
from .dots_and_boxes import DotsAndBoxesGame

# Track connected websockets (switch to single-client if resources are tight)
ws_clients = set()

class ESPServer:
    def __init__(self, config=None):
        self.config = config
        self.pool = socketpool.SocketPool(wifi.radio)

        # Serve from CIRCUITPY/_www
        self.server = Server(self.pool, root_path="/_www", debug=False)
        self.server.request_buffer_size = 2048  # tweak if needed

        # ---- Routes ----
        @self.server.route("/", GET)
        def index(request: Request):
            # Streams /_www/index.html with proper content-type
            return FileResponse(request, "/index.html")
        
        @self.server.route("/reactle", GET)
        def index(request: Request):
            # Streams /_www/index.html with proper content-type
            return FileResponse(request, "/index.html")
        
        @self.server.route("/battleship", GET)
        def index(request: Request):
            # Streams /_www/index.html with proper content-type
            return FileResponse(request, "/index.html")
        
        @self.server.route("/tic-tac-toe", GET)
        def index(request: Request):
            # Streams /_www/index.html with proper content-type
            return FileResponse(request, "/index.html")
        
        @self.server.route("/dots-and-boxes", GET)
        def index(request: Request):
            # Streams /_www/index.html with proper content-type
            return FileResponse(request, "/index.html")

        @self.server.route("/api", GET)
        def api_route(request: Request):
            print(f"API request from {request.client_address}")
            return JSONResponse(request, {"ok": True, "ip": str(wifi.radio.ipv4_address)})


        @self.server.route("/ws", GET)
        def ws_route(request: Request):
            ws = Websocket(request)
            ws_clients.add(ws)
            print("WS client connected; total:", len(ws_clients))
            return ws

        @self.server.route("/ws/dots-and-boxes", GET)
        def dots_and_boxes_ws_route(request: Request):
            ws = Websocket(request)
            DotsAndBoxesGame.handle_ws(ws)
            return ws

    def start(self):
        print("Starting ESP WebSocket server…")
        ip = str(wifi.radio.ipv4_address)
        self.server.start(ip, 80)
        print(f"HTTP/WS listening at: http://{ip}")

        last_tick = time.monotonic()

        while True:
            # 1) Keep HTTP and WS connections serviced
            self.server.poll()

            # 2) Poll Dots and Boxes game logic
            DotsAndBoxesGame.poll()

            # 3) Tiny yield keeps things responsive
            time.sleep(0.01)
