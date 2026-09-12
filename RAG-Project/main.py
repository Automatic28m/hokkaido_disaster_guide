from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import our newly built RAG Pipeline
from src.rag_pipeline import RAGPipeline

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your Next.js frontend to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# We initialize the pipeline globally so it stays in RAM.
# This prevents the AI models from reloading on every single chat message!
try:
    pipeline = RAGPipeline()
except Exception as e:
    print(f"Warning: Could not initialize RAG Pipeline. Did you run build_index.py? Error: {e}")
    pipeline = None

from typing import Optional, List, Dict
class ChatRequest(BaseModel):
    message: Optional[str] = None
    messages: Optional[List[Dict[str, str]]] = None

@app.get("/")
def read_root():
    return {"status": "Hokkaido RAG Backend is running and intelligent!"}

@app.post("/ask")
def ask_ai(req: ChatRequest):
    if pipeline is None:
         return {"reply": "Backend Error: The RAG Pipeline is not initialized. Please run `python build_index.py` first."}
         
    if req.messages and len(req.messages) > 0:
        latest_message = req.messages[-1].get("content", "")
        answer = pipeline.ask(latest_message, chat_history=req.messages)
    else:
        answer = pipeline.ask(req.message)
    
    return {"reply": answer}

@app.post("/reset_memory")
def reset_memory():
    from src.memory import global_memory
    global_memory.clear()
    return {"status": "Memory wiped."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)