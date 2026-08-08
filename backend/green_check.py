import time
import requests
import random

ELECTRICITY_MAPS_TOKEN = "WtncS8d8bCh7J6wDr8E8"
ELECTRICITY_MAPS_API_URL = "https://api.electricitymaps.com/v3/carbon-intensity/latest"

def get_current_carbon_intensity(zone: str = "IN-WE") -> dict:
    """
    Fetches real-time carbon intensity from the ElectricityMaps API.
    Falls back to a mock value if the request fails.
    """
    try:
        headers = {"auth-token": ELECTRICITY_MAPS_TOKEN}
        params = {"zone": zone}
        response = requests.get(ELECTRICITY_MAPS_API_URL, headers=headers, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        intensity = data.get("carbonIntensity", 150)
        
        status = "green" if intensity < 100 else "moderate" if intensity < 200 else "dirty"
        
        return {
            "region": zone,
            "timestamp": data.get("datetime", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())),
            "intensity": intensity,
            "status": status
        }
    except Exception as e:
        print(f"[API ERROR] Failed to fetch ElectricityMaps data: {e}. Falling back to mock data.")
        mock_intensity = int(random.triangular(200, 800, 500))
        status = "green" if mock_intensity < 100 else "moderate" if mock_intensity < 200 else "dirty"
        return {
            "region": zone,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "intensity": mock_intensity, # gCO2eq/kWh
            "status": status
        }
