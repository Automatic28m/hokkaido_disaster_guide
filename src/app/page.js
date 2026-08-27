"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
      scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setIsLoading(true);

    try {
        // Native fetch matching the Thaivel approach
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText })
        });
        
        const data = await response.json();
        
        setMessages(prev => [...prev, {
            role: 'ai',
            content: data.reply
        }]);
    } catch (error) {
        console.error("Chat Error:", error);
        setMessages(prev => [...prev, {
            role: 'ai',
            content: "Sorry, I am having trouble connecting right now. Please try again."
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans flex flex-col items-center justify-center p-4">
      
      {/* Main Chat Container */}
      <div className="w-full max-w-2xl bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Hokkaido Guide AI</h1>
          <p className="text-xs text-gray-500">Powered by Llama 3.3 & Real-Time Weather</p>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fafafa]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <p>Ask me about the weather or disaster procedures in Hokkaido!</p>
            </div>
          ) : (
            messages.map((m, index) => (
              <div key={index} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                
                {/* Message Bubble */}
                {m.content && (
                  <div
                    className={`max-w-[80%] px-5 py-3 rounded-2xl leading-relaxed text-sm ${
                      m.role === "user"
                        ? "bg-black text-white rounded-br-none"
                        : "bg-white border border-gray-200 text-gray-800 shadow-sm rounded-bl-none"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
             <div className="text-xs text-gray-400 animate-pulse flex items-start">AI is thinking...</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. What is the weather like in Sapporo right now?"
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}
