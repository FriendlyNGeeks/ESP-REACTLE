import mdns, wifi

class ESP_Mdns():
    def __init__(self, config):
        self.config = config
        self.enabled = config["MDNS"]["ENABLE"]
        self.server = mdns.Server(wifi.radio)
        self.server.hostname = config["MDNS"]["HOST"]
        self.port = config["MDNS"]["PORT"]
        
    def start(self):
        if self.enabled:
            print("Enabling mDNS")
            try:
                self.server.advertise_service(service_type="_http", protocol="_tcp", port=self.port)
                print("mDNS | SUCCESS")
                print(f"mDNS hostname: {self.server.hostname}.{self.port}")
            except Exception as e:
                print(f"Error enabling mDNS: {e}")
        else:
            print("mDNS | DISABLED")