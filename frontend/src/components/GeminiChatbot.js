import React, { useState, useRef, useEffect } from 'react';
import API from '../api/index';

/**
 * Gemini AI Chatbot Component with Action Automation
 * Can navigate, logout, search, register for events, and more
 */
export default function GeminiChatbot({ 
  onNavigate, 
  onLogout, 
  onSearch, 
  onRegisterEvent,
  onViewEvent,
  events = [],
  clubs = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI assistant powered by Gemini. I can help you with:\n\n• Navigate the platform (open pages, search, register for events)\n• Answer ANY questions (general knowledge, academic, technical, creative)\n• Help with platform features and usage\n\nJust ask me anything or tell me what you'd like to do!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const executeAction = (actionData) => {
    const { action, target, message } = actionData;

    // Always show the message first
    if (message) {
      setMessages((prev) => [...prev, { role: 'assistant', content: message }]);
    }

    // Execute action after a brief delay (except for info which just shows message)
    if (action === 'info') {
      // Info actions only show the message, no execution needed
      return;
    }

    setTimeout(() => {
      switch (action) {
        case 'navigate':
          if (onNavigate && target) {
            onNavigate(target);
            // Don't add another message, the initial message already confirmed
          }
          break;

        case 'logout':
          if (actionData.requiresConfirmation) {
            setPendingAction({ action: 'logout', target: null });
            // Confirmation message already shown above
          } else if (onLogout) {
            onLogout();
          }
          break;

        case 'search':
          if (onSearch && target) {
            onSearch(target);
            // Search confirmation already in message
          }
          break;

        case 'register':
          if (onRegisterEvent && target) {
            // Try to find event by ID or name
            const eventId = parseInt(target) || findEventByName(target);
            if (eventId) {
              onRegisterEvent(eventId);
            } else {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: `I couldn't find that event. Could you provide the event ID or a more specific name?` },
              ]);
            }
          }
          break;

        case 'view_event':
          if (onViewEvent && target) {
            const eventId = parseInt(target) || findEventByName(target);
            if (eventId) {
              onViewEvent(eventId);
            } else {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: `I couldn't find that event. Could you provide the event ID or name?` },
              ]);
            }
          }
          break;

        default:
          // No action needed
          break;
      }
    }, 300);
  };

  const findEventByName = (name) => {
    const lowerName = name.toLowerCase();
    const event = events.find(
      (e) => e.title && e.title.toLowerCase().includes(lowerName)
    );
    return event ? event.id : null;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    
    // Handle confirmation for pending actions
    if (pendingAction) {
      const lowerMessage = userMessage.toLowerCase();
      if (lowerMessage === 'yes' || lowerMessage === 'y' || lowerMessage === 'confirm') {
        if (pendingAction.action === 'logout' && onLogout) {
          setInput('');
          setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Logging you out...' },
          ]);
          setPendingAction(null);
          setTimeout(() => {
            onLogout();
          }, 1000);
        }
      } else if (lowerMessage === 'no' || lowerMessage === 'n' || lowerMessage === 'cancel') {
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Cancelled. How else can I help you?' },
        ]);
        setPendingAction(null);
      } else {
        // Not a confirmation, treat as new message
        setPendingAction(null);
        // Continue with normal flow
      }
    }

    // If we handled confirmation, return early
    if (pendingAction && (userMessage.toLowerCase() === 'yes' || userMessage.toLowerCase() === 'no' || 
        userMessage.toLowerCase() === 'y' || userMessage.toLowerCase() === 'n' || 
        userMessage.toLowerCase() === 'confirm' || userMessage.toLowerCase() === 'cancel')) {
      return;
    }

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await API.post('/api/ai/chat', {
        message: userMessage,
        conversation_history: messages.slice(-10),
      });

      const responseData = response.data;

      // Check if response has action structure
      if (responseData.action) {
        executeAction(responseData);
      } else {
        // Fallback to old format
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: responseData.response || responseData.message || 'I received your message.' },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hello! I'm your AI assistant powered by Gemini. I can help you with:\n\n• Navigate the platform (open pages, search, register for events)\n• Answer ANY questions (general knowledge, academic, technical, creative)\n• Help with platform features and usage\n\nJust ask me anything or tell me what you'd like to do!",
      },
    ]);
    setPendingAction(null);
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        aria-label="Open AI Assistant"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        }}
      >
        {isOpen ? (
          <svg
            className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90"
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
        ) : (
          <svg
            className="w-6 h-6 transition-transform duration-300 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div
          className="fixed bottom-32 right-6 z-50 w-96 h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between border-b"
            style={{
              borderColor: 'rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9))',
                }}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">AI Assistant</h3>
                <p className="text-xs text-gray-500">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                title="Clear chat"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                title="Close"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
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
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                  style={
                    msg.role === 'assistant'
                      ? {
                          background: 'linear-gradient(135deg, rgba(243, 244, 246, 0.9), rgba(229, 231, 235, 0.9))',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.5)',
                        }
                      : {}
                  }
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="bg-gray-100 rounded-2xl px-4 py-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(243, 244, 246, 0.9), rgba(229, 231, 235, 0.9))',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="p-4 border-t"
            style={{
              borderColor: 'rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(249, 250, 251, 0.9))',
            }}
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={pendingAction ? "Type 'yes' to confirm or 'no' to cancel..." : "Type your message..."}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                style={{
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                }}
              >
                {isLoading ? (
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                ) : (
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
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
