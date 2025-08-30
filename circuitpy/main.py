# FILE: /captive-portal/captive-portal/src/main.py
import json, time
from wifi import radio
from captive_portal.server import PortalServer
from esp_portal.server import ESPServer
from utils.wifi import ESP_Wifi
from utils.leader import Leader_Board

# VARIABLES
CONFIG_FILE = "/config.json"
LEADERBOARD_FILE = "/leaderboard.json"


# FUNCTIONS
def load_config(file):
    try:
        with open(file, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading config: {e}")
        return {}

# MAIN
def main():
    config = load_config(CONFIG_FILE)
    leaderboard = Leader_Board(LEADERBOARD_FILE)
    espWifi = ESP_Wifi(config)
    # Connect to WiFi or start an access point
    if config["MODE"] == "WIFI":
        espWifi.init_wifi()
    elif config["MODE"] == "AP":
        espWifi.adhoc_ap()
    if radio.connected:
        esp_server = ESPServer(config, leaderboard)
        esp_server.start()
    elif radio.ap_active:
        portal_server = PortalServer(config, leaderboard)
        portal_server.start()
    
    
if __name__ == "__main__":
    main()