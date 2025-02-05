"use client";
import { useState } from "react";
import { MessageCircle, Book, Calendar, FileText, Send } from "lucide-react";

export default function CourseAssistantUI() {
  const [messages, setMessages] = useState<{ type: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { type: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await response.json();
      
      if (data.reply) {
        setMessages((prev) => [...prev, { type: "bot", content: data.reply }]);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <div className="w-56 bg-white dark:bg-gray-800 shadow-sm border-r dark:border-gray-700">
        <div className="p-4">
          <select className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select Course...</option>
          </select>
        </div>
        
        <div className="px-2">
          <button className="flex items-center w-full p-3 mb-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <MessageCircle className="w-5 h-5 mr-3" />
            Chat
          </button>
          <button className="flex items-center w-full p-3 mb-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Book className="w-5 h-5 mr-3" />
            Course Content
          </button>
          <button className="flex items-center w-full p-3 mb-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Calendar className="w-5 h-5 mr-3" />
            Deadlines
          </button>
          <button className="flex items-center w-full p-3 mb-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <FileText className="w-5 h-5 mr-3" />
            Assignments
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700">
          <h1 className="text-lg font-semibold">Course Assistant</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Currently viewing: [Course Name]</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-xl ${
                  message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-700'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-700 p-4 rounded-xl">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about assignments, deadlines, or course materials..."
              className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
            <button
              onClick={handleSend}
              className="px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
