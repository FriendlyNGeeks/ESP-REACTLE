import wifi
from utils.mdns import ESP_Mdns

class ESP_Wifi:
    def __init__(self, config):
        self.config = config
        
    def init_wifi(self):
        try:
            wifi.radio.hostname = self.config["WIFI"]["HOST"]
            print(f"Connecting to {self.config['WIFI']['SSID']}...")
            wifi.radio.connect(self.config["WIFI"]["SSID"], self.config["WIFI"]["PASS"])
            if wifi.radio.connected:
                print("Connection | SUCCESS")
                print("Radio hostname |", wifi.radio.hostname)
                mdns = ESP_Mdns(self.config)
                mdns.start()
        except ConnectionError as e:
            print("Connection | ERROR:", e)
            ESP_Wifi.adhoc_ap(self.config)

    def adhoc_ap(self):
        wifi.radio.hostname = config["WIFI"]["HOST"]
        if self.config["AP"]["WPA"] == True:
            print(f"Starting Ad-Hoc(AP): {self.config['AP']['SSID']}")
            wifi.radio.start_ap(self.config["AP"]["SSID"], self.config["AP"]["PASS"])
            print(f"IP: {wifi.radio.ipv4_gateway_ap} PASS: {self.config['AP']['PASS']}")
        else:
            print(f"Starting Ad-Hoc(AP): {self.config['AP']['SSID']}")
            wifi.radio.start_ap(self.config["AP"]["SSID"])
            print(f"IP: {wifi.radio.ipv4_gateway_ap} PASS: None")
            mdns = ESP_Mdns(self.config)
            mdns.start