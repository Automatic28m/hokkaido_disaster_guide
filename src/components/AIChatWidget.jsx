'use client'
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, X, MessageSquare } from 'lucide-react';

export function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        {
            role: 'ai',
            content: "Hello! I am your Hokkaido AI Guide. You can ask me about disaster procedures, weather, or train statuses."
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isLoading, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input;
        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        setInput('');
        setIsLoading(true);

        try {
            // Using native fetch instead of axios to reduce dependencies
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
                content: "I'm having trouble connecting to my servers right now. Please try again later."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <div className={`mb-4 w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 h-[500px]' : 'scale-0 opacity-0 h-0'}`}>
                
                {/* Header */}
                <div className="bg-black text-white px-5 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Bot size={20} />
                        <span className="font-semibold text-sm">Hokkaido AI Guide</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 bg-gray-50">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className="shrink-0 mt-1">
                                {msg.role === 'ai' ? (
                                    <div className="bg-black text-white p-1.5 rounded-full"><Bot size={16} /></div>
                                ) : (
                                    <div className="bg-gray-200 text-gray-700 p-1.5 rounded-full"><User size={16} /></div>
                                )}
                            </div>
                            <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-black text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                                    <div className="prose prose-sm max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 flex-row items-end mt-2">
                            <div className="bg-black text-white p-1.5 rounded-full mb-1 shrink-0"><Bot size={16} /></div>
                            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-100 p-4">
                    <form onSubmit={handleSendMessage} className="relative w-full flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="w-full bg-gray-100 border-transparent rounded-full py-2.5 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-black text-sm text-gray-800"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
}
