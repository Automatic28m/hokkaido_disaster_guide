import requests

def get_real_time_weather(city_name: str) -> str:
    """Fetches real-time weather from Meteosource API"""
    api_key = "nrv550ngnwo9vd4fdji129lpy7wlxk2xpn12czq0"
    try:
        find_url = f"https://www.meteosource.com/api/v1/free/find_places_prefix?text={city_name}&key={api_key}"
        find_res = requests.get(find_url).json()
        
        if not find_res:
            return f"Could not find weather data for the city: {city_name}."
            
        place_id = find_res[0]['place_id']
        name = find_res[0]['name']
        
        weather_url = f"https://www.meteosource.com/api/v1/free/point?place_id={place_id}&sections=all&timezone=UTC&language=en&units=metric&key={api_key}"
        weather_data = requests.get(weather_url).json()
        
        current = weather_data['current']
        hourly_data = weather_data['hourly']['data'][:24]
        
        # Format hourly data compactly
        hourly_str = ", ".join([f"{h['date']} (UTC): {h['temperature']}°C {h['summary']}" for h in hourly_data])
        
        return f"Current Weather in {name}: {current['temperature']}°C, {current['summary']}. Wind: {current['wind']['speed']}m/s.\nHourly Forecast (in UTC time, you MUST convert this to the user's local timezone UTC+7 before answering!): {hourly_str}"
    except Exception as e:
        return f"Weather data currently unavailable for {city_name}."

# Define the tool schema for Groq LLM
WEATHER_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "get_weather_for_city",
        "description": "Fetch the current real-time weather for ANY city in the world.",
        "parameters": {
            "type": "object",
            "properties": {
                "city": { 
                    "type": "string", 
                    "description": "The name of the city, e.g. Sapporo, Tokyo, London, Niseko" 
                }
            },
            "required": ["city"]
        }
    }
}
