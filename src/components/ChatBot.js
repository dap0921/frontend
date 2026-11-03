import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();

    const text = input.trim();
    if (!text || loading) return;

    let storedUser = {};

    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      storedUser = {};
    }

    const token = storedUser.token;

    if (!token) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Your session has expired. Please log in again.",
        },
      ]);
      return;
    }

    const newMessages = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/chat",
        { messages: newMessages },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            response.data.reply || "I couldn't generate a reply.",
        },
      ]);
    } catch (error) {
      console.error(
        "Chatbot error:",
        error.response?.data || error.message
      );

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            error.response?.data?.errorMessage ||
            "I couldn't connect right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const suggestions = [
    {
      icon: "◈",
      title: "Manage expenses",
      description: "Build better spending habits",
      prompt: "How can I manage my expenses?",
    },
    {
      icon: "▤",
      title: "Budget smarter",
      description: "Create a practical budget",
      prompt: "Give me budgeting tips",
    },
    {
      icon: "↗",
      title: "Save more",
      description: "Find ways to save money",
      prompt: "How can I save more money?",
    },
  ];

  const startSuggestion = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[#080b09] p-3 text-white sm:p-6">
      <div className="mx-auto flex h-[calc(100dvh-24px)] max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d110e] shadow-[0_25px_100px_rgba(0,0,0,0.45)] sm:h-[calc(100dvh-48px)]">

        {/* Header */}
        <header className="relative flex items-center justify-between border-b border-white/[0.07] bg-[#0d110e] px-4 py-4 sm:px-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.09] text-2xl text-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.08)]">
              ✦
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight sm:text-xl">
                Finance Assistant
              </h1>

              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Your personal money companion
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.07] hover:text-emerald-300 sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">← Back</span>
            <span className="hidden sm:inline">← Dashboard</span>
          </button>
        </header>

        {/* Chat area */}
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.045),transparent_48%)] px-4 py-6 sm:px-8 sm:py-8">
          {messages.length === 0 ? (
            <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center py-8 text-center">

              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-[28px] bg-emerald-400/10 blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.14] to-emerald-400/[0.03] text-4xl text-emerald-400">
                  ✦
                </div>
              </div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400 sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Personal Finance AI
              </div>

              <h2 className="max-w-xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                Make smarter moves
                <span className="mt-1 block bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                  with your money.
                </span>
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-gray-400 sm:text-base">
                Your financial journey starts with a question. Get ideas
                for budgeting, saving, and managing everyday expenses.
              </p>

              <div className="mt-9 grid w-full gap-3 text-left sm:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    type="button"
                    onClick={() => startSuggestion(suggestion.prompt)}
                    className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-emerald-400/[0.045] sm:p-5"
                  >
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07] text-xl text-emerald-400 transition group-hover:bg-emerald-400/[0.13]">
                      {suggestion.icon}
                    </div>

                    <h3 className="text-sm font-semibold text-gray-100">
                      {suggestion.title}
                    </h3>

                    <p className="mt-1.5 text-xs leading-5 text-gray-500">
                      {suggestion.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500 transition group-hover:text-emerald-400">
                      <span>Ask assistant</span>
                      <span>↗</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((message, index) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/[0.09] text-lg text-emerald-400">
                        ✦
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3.5 text-sm leading-6 sm:max-w-[78%] ${
                        isUser
                          ? "rounded-tr-sm border border-emerald-400/20 bg-emerald-400/[0.12] text-emerald-50"
                          : "rounded-tl-sm border border-white/[0.08] bg-[#141a15] text-gray-200"
                      }`}
                    >
                      <p
                        className={`mb-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                          isUser ? "text-emerald-400" : "text-gray-500"
                        }`}
                      >
                        {isUser ? "You" : "Finance Assistant"}
                      </p>

                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>

                    {isUser && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-xs font-bold text-gray-300">
                        You
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/[0.09] text-lg text-emerald-400">
                    ✦
                  </div>

                  <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-[#141a15] px-4 py-3.5">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Finance Assistant
                    </p>

                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </main>

        {/* Input area */}
        <footer className="border-t border-white/[0.07] bg-[#0d110e] px-4 py-4 sm:px-7">
          <form
            onSubmit={sendMessage}
            className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/10 bg-[#141a15] p-2 transition focus-within:border-emerald-400/40 focus-within:ring-4 focus-within:ring-emerald-400/[0.05] sm:gap-3"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ask about budgeting, expenses, or savings..."
              disabled={loading}
              aria-label="Your message"
              className="max-h-32 min-h-11 flex-1 resize-y bg-transparent px-3 py-3 text-sm text-gray-100 outline-none placeholder:text-gray-600 disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-xl font-semibold text-[#07110b] shadow-[0_0_20px_rgba(52,211,153,0.08)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              ↑
            </button>
          </form>

          <p className="mt-3 text-center text-[10px] text-gray-600 sm:text-xs">
            AI-generated guidance may be inaccurate. Verify important
            financial decisions.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ChatBot;
