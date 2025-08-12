import wifi
from utils.mdns import ESP_Mdns

class ESP_Wifi:
    def __init__(self, config):
        self.config = config
        
    def init_wifi(config):
        try:
            wifi.radio.hostname = config["WIFI"]["HOST"]
            print(f"Connecting to {config['WIFI']['SSID']}...")
            wifi.radio.connect(config["WIFI"]["SSID"], config["WIFI"]["PASS"])
            if wifi.radio.connected:
                print("Connection | SUCCESS")
                print("Radio hostname |", wifi.radio.hostname)
                mdns = ESP_Mdns(config)
                mdns.start()
        except ConnectionError as e:
            print("Connection | ERROR:", e)
            ESP_Wifi.adhoc_ap(config)

    def adhoc_ap(config):
        wifi.radio.hostname = config["WIFI"]["HOST"]
        if config["AP"]["WPA"] == True:
            print(f"Starting Ad-Hoc(AP): {config['AP']['SSID']}")
            wifi.radio.start_ap(config["AP"]["SSID"], config["AP"]["PASS"])
            print(f"IP: {wifi.radio.ipv4_gateway_ap} PASS: {config['AP']['PASS']}")
        else:
            print(f"Starting Ad-Hoc(AP): {config['AP']['SSID']}")
            wifi.radio.start_ap(config["AP"]["SSID"])
            print(f"IP: {wifi.radio.ipv4_gateway_ap} PASS: None")
            mdns = ESP_Mdns(config)
            mdns.start