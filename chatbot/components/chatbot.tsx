"use client";

import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Book,
  Calendar,
  FileText,
  Send,
  Sun,
  Moon,
  Menu,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Card, CardHeader } from "./ui/card";

interface Message {
  sender: "user" | "bot";
  text: string;
  id?: string;
  rated?: boolean;
}

const Talk: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSessionId(new Date().toISOString());
    const fetchChatHistory = async () => {
      try {
        const response = await fetch("/api/chatHistory");
        if (!response.ok) throw new Error("Failed to fetch chat history");
        const data = await response.json();
        setMessages(data.history || []);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };
    fetchChatHistory();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { sender: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, sessionId }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();

      const botMessage: Message = {
        sender: "bot",
        text: data.reply || "I'm not sure how to respond to that.",
        id: data.messageId || undefined, // Store the message ID from the response
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      if (data.sessionId) setSessionId(data.sessionId);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: "Error: Unable to process message." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle rating
  const rateMessage = async (messageId: string, rating: "helpful" | "unhelpful") => {
    if (!messageId) return;
    
    try {
      const response = await fetch("/api/rate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating }),
      });
      
      if (!response.ok) throw new Error("Failed to rate message");
      
      // Update the UI to show the message has been rated
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, rated: true } : msg
        )
      );
    } catch (error) {
      console.error("Error rating message:", error);
    }
  };

  // Sidebar Component
  const Sidebar = () => (
    <div
      className={`fixed md:static inset-y-0 left-0 z-30 w-64 transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } transition-transform duration-300 ease-in-out ${
        darkMode ? "bg-black" : "bg-gray-50"
      } p-4 shadow-lg border-r ${darkMode ? "border-gray-800" : "border-gray-200"}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
          Dashboard
        </h2>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full ${
            darkMode
              ? "bg-gray-800 text-yellow-500 hover:bg-gray-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <select
        className={`w-full p-2 mb-4 rounded-lg ${
          darkMode
            ? "bg-gray-800 text-white border-gray-700"
            : "bg-white text-gray-900 border-gray-300"
        } border`}
      >
        <option value="">MCY 660 - Risk Management</option>
      </select>

      <div className="space-y-2">
        {["Chat", "Course Content", "Deadlines", "Assignments"].map((item, index) => (
          <button
            key={index}
            className={`flex items-center w-full p-3 rounded-lg transition ${
              darkMode
                ? "bg-gray-800 text-white hover:bg-gray-700 hover:text-yellow-500"
                : "bg-white text-gray-900 hover:bg-gray-100 hover:text-yellow-600"
            }`}
          >
            {index === 0 && <MessageCircle className="w-5 h-5 mr-3" />}
            {index === 1 && <Book className="w-5 h-5 mr-3" />}
            {index === 2 && <Calendar className="w-5 h-5 mr-3" />}
            {index === 3 && <FileText className="w-5 h-5 mr-3" />}
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen ${darkMode ? "bg-gray-900" : "bg-white"} transition-colors duration-300`}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        <Card className={`border-0 ${darkMode ? "bg-gray-900" : "bg-white "}`}>
          <CardHeader className={`border-0 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`md:hidden p-2 rounded-lg ${
                  darkMode ? "text-white hover:bg-gray-800" : "text-gray-900 hover:bg-gray-100"
                }`}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div
                className={`p-4 ${
                  darkMode ? "text-white": "text-gray-900"
                }`}
              >
                <h1 className="text-lg font-semibold">Cybersecurity Assistant</h1>
                <p className="text-sm">AI-powered assistant for Risk Management.</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] md:max-w-[70%] p-3 rounded-xl ${
                  msg.sender === "user"
                    ? "bg-yellow-500 text-black"
                    : darkMode
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-900 shadow-md"
                }`}
              >
                <div className="flex flex-col">
                  <div>{msg.text}</div>
                  
                  {/* Rating buttons for bot messages only */}
                  {msg.sender === "bot" && msg.id && !msg.rated && (
                    <div className="flex justify-end mt-2 space-x-2">
                      <button 
                        onClick={() => rateMessage(msg.id!, "helpful")}
                        className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-green-500 transition-colors"
                        aria-label="Helpful"
                      >
                        <ThumbsUp size={16} />
                      </button>
                      <button 
                        onClick={() => rateMessage(msg.id!, "unhelpful")}
                        className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Unhelpful"
                      >
                        <ThumbsDown size={16} />
                      </button>
                    </div>
                  )}
                  
                  {/* Show a "rated" indicator after rating */}
                  {msg.sender === "bot" && msg.rated && (
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      Thanks for your feedback
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-4 ${darkMode ? "bg-black" : "bg-white"} border-t ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage(e)}
              placeholder="Type a message..."
              className={`flex-1 p-3 rounded-xl ${
                darkMode
                  ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500"
                  : "bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-400"
              } border`}
            />
            <button
              onClick={sendMessage}
              className="px-4 bg-yellow-500 text-black rounded-xl hover:bg-yellow-600 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Talk;