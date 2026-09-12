import requests
import json
from config import config
from src.tools import get_real_time_weather, WEATHER_TOOL_SCHEMA

class Generator:
    def __init__(self):
        self.api_key = config.GROQ_API_KEY
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = config.LLM_MODEL

    def generate(self, query, context_chunks, chat_history=None):
        if not config.USE_LLM:
            return "DEBUG MODE (LLM OFF):\n\n" + "\n\n".join([f"[{c['metadata']['situation']}] {c['text']}" for c in context_chunks])
            
        context_str = "\n\n".join([f"Source ({c['metadata']['situation']}): {c['text']}" for c in context_chunks])
        system_prompt = config.SYSTEM_PROMPT.replace("{context}", context_str)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        messages = [{"role": "system", "content": system_prompt}]
        
        if chat_history:
            # We don't want to overflow the context window, so keep last 6 messages
            recent_history = chat_history[-6:]
            for msg in recent_history:
                role = "assistant" if msg["role"] == "ai" else msg["role"]
                messages.append({"role": role, "content": msg["content"]})
        else:
            messages.append({"role": "user", "content": query})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "tools": [WEATHER_TOOL_SCHEMA],
            "tool_choice": "auto",
            "temperature": 0.2,
            "max_tokens": 1000
        }
        
        # Initial request to Groq with Tools and RAG context
        response = requests.post(self.api_url, headers=headers, json=payload)
        
        if response.status_code != 200:
            print(f"Groq API Error: {response.text}")
            return "Sorry, I am having trouble connecting to my Groq AI brain right now."

        response_data = response.json()
        message = response_data["choices"][0]["message"]
        
        # If Groq decides it needs the weather to answer the user's question
        if "tool_calls" in message and message["tool_calls"]:
            messages.append(message)
            
            for tool_call in message["tool_calls"]:
                if tool_call["function"]["name"] == "get_weather_for_city":
                    args = json.loads(tool_call["function"]["arguments"])
                    print(f"Tool Triggered! Fetching live weather for: {args.get('city')}")
                    
                    weather_info = get_real_time_weather(args.get("city"))
                    
                    messages.append({
                        "tool_call_id": tool_call["id"],
                        "role": "tool",
                        "name": "get_weather_for_city",
                        "content": weather_info
                    })
                    
            # Send the final request back to Groq (which now contains RAG Rules + Live Weather)
            payload["messages"] = messages
            del payload["tools"]
            del payload["tool_choice"]
            
            final_response = requests.post(self.api_url, headers=headers, json=payload)
            if final_response.status_code == 200:
                return final_response.json()["choices"][0]["message"]["content"]
            else:
                return "Failed to generate final response after fetching weather data."
                
        else:
            # If no weather is needed, just return the standard RAG answer
            return message.get("content", "")
