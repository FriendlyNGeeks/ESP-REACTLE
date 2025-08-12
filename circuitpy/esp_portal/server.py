from socketpool import SocketPool
from adafruit_httpserver import Server, Request, Response, JSONResponse
import wifi, time

class ESPServer:
    def __init__(self, config):
        self.pool = SocketPool(wifi.radio)
        self.server = Server(self.pool, "/_www")
        self.server.request_buffer_size = 2048
        self.config = config

        # Define route for serving index.html
        @self.server.route("/")
        def index(request: Request):
            print("Serving index.html")
            return self.serve_file(request, "/_www/index.html")

        # Define route for serving static files
        @self.server.route("/assets/<path:path>")
        def static_files(request: Request, path: str):
            return self.serve_file(request, f"/_www/static/{path}")
        
        # Define route for serving index.html
        @self.server.route("/api")
        def rout_func(request: Request):
            print(f"API request from{request.client_address}")
            return JSONResponse(request, {"key": "value"})

    def start(self):
        print("Initilzing ESP Portal")
        try:
            self.server.start("0.0.0.0", 80) # 0.0.0.0 used for <hostname>.local
            print("ESP Portal | SUCCESS")
            print(f"Access at: http://{wifi.radio.ipv4_address}")
            while True:
                try:
                    self.server.poll()  # Handle incoming requests
                except Exception as e:
                    print(f"An error occurred: {e}")
                    print("Restarting server...in 5 seconds")
                    time.sleep(5)  # Delay before retrying
        except Exception as e:
            print(f"Error starting server: {e}")
            pass

    def serve_file(self, request: Request, file_path: str):
        try:
            with open(file_path, "r") as file:
                content = file.read()
            content_type = self.get_content_type(file_path)
            return Response(request, content, content_type=content_type)
        except Exception as e:
            print(f"Error serving file {file_path}: {e}")
            return Response(request, "File not found", status=404)

    def get_content_type(self, file_path: str) -> str:
        if file_path.endswith(".html"):
            return "text/html"
        elif file_path.endswith(".css"):
            return "text/css"
        elif file_path.endswith(".js"):
            return "application/javascript"
        else:
            return "text/plain"