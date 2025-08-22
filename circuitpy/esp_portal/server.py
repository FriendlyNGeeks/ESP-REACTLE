# --- server.py (WebSocket-only) ---
import time
import json
import wifi
import socketpool
from adafruit_httpserver import (
    Server, Request, JSONResponse, Websocket, FileResponse, GET
)

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

        @self.server.route("/api", GET)
        def api_route(request: Request):
            print(f"API request from {request.client_address}")
            return JSONResponse(request, {"ok": True, "ip": str(wifi.radio.ipv4_address)})

        @self.server.route("/ws", GET)
        def ws_route(request: Request):
            """
            Upgrade to WebSocket and return the Websocket object.
            Do NOT block here; main loop handles send/receive while server.poll() runs.
            """
            ws = Websocket(request)
            ws_clients.add(ws)
            print("WS client connected; total:", len(ws_clients))
            return ws  # critical: return the Websocket to keep it alive

    def start(self):
        print("Starting ESP WebSocket server…")
        ip = str(wifi.radio.ipv4_address)
        self.server.start(ip, 80)
        print(f"HTTP/WS listening at: http://{ip}")

        last_tick = time.monotonic()

        while True:
            # 1) Keep HTTP and WS connections serviced
            self.server.poll()

            # 2) Periodic WS broadcast (example: once per second)
            now = time.monotonic()
            if now - last_tick >= 1.0:
                payload = json.dumps({"type": "counter", "ts": now})
                dead = []
                for ws in tuple(ws_clients):  # snapshot to allow pruning
                    try:
                        # Raise on failure so we can prune dead sockets
                        ws.send_message(payload, fail_silently=False)
                    except Exception as e:
                        print("WS send failed; dropping client:", e)
                        dead.append(ws)
                for ws in dead:
                    try:
                        ws.close()
                    except Exception:
                        pass
                    ws_clients.discard(ws)
                last_tick = now

            # 3) Optional: read any incoming messages non-blocking
            for ws in tuple(ws_clients):
                try:
                    msg = ws.receive(fail_silently=True)
                    if msg is not None:
                        print("WS RX:", msg)
                        # Example echo:
                        # ws.send_message(json.dumps({"type": "echo", "data": msg}), fail_silently=True)
                except Exception:
                    # Treat any receive exception as a dead socket
                    try:
                        ws.close()
                    except Exception:
                        pass
                    ws_clients.discard(ws)

            # Tiny yield keeps things responsive
            time.sleep(0.01)
