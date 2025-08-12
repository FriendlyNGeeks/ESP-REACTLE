# FILE: /captive-portal/captive-portal/src/main.py
import json, time
from wifi import radio
from captive_portal.server import PortalServer
from esp_portal.server import ESPServer
from utils.wifi import ESP_Wifi

# VARIABLES
CONFIG_FILE = "/config.json"

# FUNCTIONS
def load_config(file):
    try:
        with open(file, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading config: {e}")

# MAIN
def main():
    config = load_config(CONFIG_FILE)
    # Connect to WiFi or start an access point
    if config["MODE"] == "WIFI":
        ESP_Wifi.init_wifi(config)
    elif config["MODE"] == "AP":
        ESP_Wifi.adhoc_ap(config)
    if radio.connected:
        esp_server = ESPServer(config)
        esp_server.start()
    elif radio.ap_active:
        portal_server = PortalServer(config)
        portal_server.start()
    
    
if __name__ == "__main__":
    main()