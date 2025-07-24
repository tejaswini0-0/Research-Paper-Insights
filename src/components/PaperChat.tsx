import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface Paper {
  id: string;
  title: string;
  fileName: string;
  summary?: string;
  uploadedAt: number;
  status: "completed" | "processing" | "error" | "uploaded";
  filePath?: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

interface PaperChatProps {
  paper: Paper;
  onClose: () => void;
}

interface ChatHistoryItem {
  paperId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const API_URL = process.env.REACT_APP_API_URL || 'https://research-paper-insights.onrender.com';

export function PaperChat({ paper, onClose }: PaperChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ✅ Load summary + history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`${API_URL}/chat_history/${paper.id}`);
        const historyData: ChatHistoryItem[] = await res.json();

        // Convert history items to messages
        const loadedMessages: Message[] = historyData.map((item) => ({
          id: `${item.timestamp}`,
          content: item.content,
          isUser: item.role === "user",
          timestamp: item.timestamp,
        }));

        // Find the summary (it's usually the first assistant message with "Summary" in question)
        const summaryIndex = loadedMessages.findIndex(
          (msg, i) => 
            !msg.isUser && 
            i > 0 && 
            loadedMessages[i-1].content === "Summary of this paper"
        );

        let introMessage: Message | null = null;
        if (summaryIndex !== -1) {
          // Extract summary message and its corresponding question
          introMessage = loadedMessages[summaryIndex];
          // Remove summary Q&A pair from the history
          loadedMessages.splice(summaryIndex - 1, 2);
        }

        // If no summary found, create default intro
        if (!introMessage) {
          introMessage = {
            id: "intro",
            content: paper.summary || 
              `Hi! I'm ready to help you understand "${paper.fileName}". Ask me anything about this research paper!`,
            isUser: false,
            timestamp: Date.now(),
          };
        }

        // Sort messages by timestamp
        const sortedMessages = loadedMessages.sort((a, b) => a.timestamp - b.timestamp);

        // Set messages with intro first, then history
        setMessages([introMessage, ...sortedMessages]);
      } catch (err) {
        console.error("Failed to load chat history:", err);
        // Set default intro message on error
        setMessages([{
          id: "intro",
          content: `Hi! I'm ready to help you understand "${paper.fileName}". Ask me anything about this research paper!`,
          isUser: false,
          timestamp: Date.now(),
        }]);
      }
    }

    loadHistory();
  }, [paper]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paperId: paper.id,
          question: inputValue,
        }),
      });

      const data = await res.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer || "Sorry, I couldn't find an answer.",
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I'm sorry, I encountered an error while processing your question. Please try again.",
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What are the main findings of this paper?",
    "What methodology was used in this research?",
    "What are the limitations of this study?",
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-purple-600/10 to-pink-600/10">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Chat with Paper</h3>
            <p className="text-sm text-gray-400 truncate max-w-md">
              {paper.title}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${message.isUser
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "bg-gray-700/50 text-gray-100 border border-gray-600/50"
                }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-2 ${message.isUser ? "text-purple-100" : "text-gray-400"
                  }`}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700/50 border border-gray-600/50 px-4 py-3 rounded-2xl">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-gray-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 2 && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-400 mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.slice(0, 3).map((question, index) => (
              <button
                key={index}
                onClick={() => setInputValue(question)}
                className="text-xs px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-full transition-colors border border-gray-600/30"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-6 border-t border-gray-700/50 bg-gray-800/30">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about this paper..."
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
