import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! 👋 How can I help you today with admissions, exams, or campus information?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Admissions");
  const chatRef = useRef(null);

  // Shortcut questions grouped by category
  const quickCategories = {
    Admissions: [
      "How do I apply for admissions?",
      "What are the admission requirements?",
      "What scholarships are available?",
      "How can I apply for a study grant?",
      "What courses are offered?",
      "What are the courses in B Tech ?",
      "How can I contact the Vice Chancellor?",
      "Who is the contact for the Vice Chancellor?",
      "What is the fee structure?",
      "What documents are required for admission?",
      "What is the last date to apply?",
      "How can I check my application status?",
      "Are there any entrance exams?"

    ],
    Exams: [
      "What are the upcoming exam dates?",
      "Where can I find my timetable?",
      "How can I check my results?",
      "What is the minimum attendance requirement?",
      "How can I get my duplicate mark sheet?",
      "What is the process for exam form submission?",
      "How do I report an exam issue?"
    ],
    Campus: [
      "Tell me about campus facilities.",
      "What are the hostel rules?",
      "How do I get a student ID card?",
      "What is the library timing?",
      "What activities are available for students?",
      "How can I join student clubs?",
      "What are the dining options on campus?",
      "Is there Wi-Fi available on campus?"   
    ],
    Placements: [
      "How are placements at Brainware University?",
      "What is the C2C Team?",
      "How can I prepare for placements?",
      "Does the university provide internship opportunities?",
      "Where can I find placement updates?",
    ],
    Support: [
      "How can I contact the helpline?",
      "Where can I submit a grievance?",
      "Does the university provide counselling?",
      "How can I report ragging?",

      

    ],
  };

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content) return;

    setMessages((m) => [...m, { sender: "user", text: content }]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/chat`, { message: content });
      const reply = res.data?.reply ?? "Sorry, something went wrong.";
      setMessages((m) => [...m, { sender: "bot", text: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { sender: "bot", text: "⚠️ Network error. Is the backend running?" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-lg h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header with Logo + Team Name */}
        <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex items-center gap-2">
          <img
            src="/university-logo.png"
            alt="University Logo"
            className="w-8 h-8 rounded-full bg-white p-1"
          />
          <h2 className="text-lg font-semibold">
            CodeStorm - University Helpdesk
          </h2>
        </div>

        {/* Chat messages */}
        <div ref={chatRef} className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.sender === "user"
                  ? "justify-end"
                  : "justify-start items-end space-x-2"
              }`}
            >
              {m.sender === "bot" && (
                <img
                  src="/university-logo.png"
                  alt="University Logo"
                  className="w-8 h-8 rounded-full border shadow"
                />
              )}
              <div
                className={`max-w-[75%] p-3 rounded-2xl shadow ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                <p>{m.text}</p>
              </div>
            </div>
          ))}

          {/* Bot typing indicator */}
          {loading && (
            <div className="flex justify-start items-end space-x-2">
              <img
                src="/university-logo.png"
                alt="University Logo"
                className="w-8 h-8 rounded-full border shadow"
              />
              <div className="bg-gray-200 text-gray-800 p-3 rounded-2xl rounded-bl-none">
                <div className="flex items-center space-x-1">
                  <span
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0s" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex justify-around bg-gray-100 border-t">
          {Object.keys(quickCategories).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 py-2 text-sm font-medium ${
                activeCategory === cat
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick reply buttons */}
        <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide">
          {quickCategories[activeCategory].map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm hover:bg-blue-200 whitespace-nowrap"
            >
              {q.length > 25 ? q.slice(0, 25) + "..." : q}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              onClick={() => send()}
              className="ml-2 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
              title="Send"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
