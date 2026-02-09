import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../lib/auth-context";

// ─── Types ────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "firmy" | "system";
  content: string;
  timestamp: Date;
}

// ─── Greek Bust SVG Icon ──────────────────────────────────────────────

const GreekBustIcon: React.FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Classical Greek bust profile silhouette */}
    <path d="M32 4C28 4 24 6 22 9C20 12 19 15 19 18C19 20 19.5 22 20 23.5C18 24.5 16.5 26 16 28C15.5 30 16 32 17 33.5L17 34C16 35 15.5 36.5 15.5 38C15.5 39.5 16 41 17 42L17.5 42.5C17 43.5 17 44.5 17 45.5C17 47 17.5 48.5 18.5 49.5L19 50L18 51C17 52.5 16.5 54 17 55.5C17.5 57 18.5 58 20 58.5L22 59L12 59C12 59 12 61 12 61.5C12 62 12 62 13 62L51 62C52 62 52 62 52 61.5C52 61 52 59 52 59L42 59L44 58.5C45.5 58 46.5 57 47 55.5C47.5 54 47 52.5 46 51L45 50L45.5 49.5C46.5 48.5 47 47 47 45.5C47 44.5 47 43.5 46.5 42.5L47 42C48 41 48.5 39.5 48.5 38C48.5 36.5 48 35 47 34L47 33.5C48 32 48.5 30 48 28C47.5 26 46 24.5 44 23.5C44.5 22 45 20 45 18C45 15 44 12 42 9C40 6 36 4 32 4ZM32 8C35 8 37.5 9.5 39 12C40.5 14.5 41 17 41 18C41 19 40.8 20 40.5 21C38 20 35 19.5 32 19.5C29 19.5 26 20 23.5 21C23.2 20 23 19 23 18C23 17 23.5 14.5 25 12C26.5 9.5 29 8 32 8ZM32 23.5C35 23.5 37.5 24.2 39.5 25.5C40.5 27 41 28.5 40.5 30C39 29.5 36 29 32 29C28 29 25 29.5 23.5 30C23 28.5 23.5 27 24.5 25.5C26.5 24.2 29 23.5 32 23.5ZM32 33C37 33 40 34 41.5 35C42 36 42 37 41.5 38C40 37.5 36.5 37 32 37C27.5 37 24 37.5 22.5 38C22 37 22 36 22.5 35C24 34 27 33 32 33ZM32 41C36 41 39 41.5 40.5 42C41 43 41 44 40.5 45C39 44.5 36 44 32 44C28 44 25 44.5 23.5 45C23 44 23 43 23.5 42C25 41.5 28 41 32 41ZM32 48C35 48 37.5 48.5 39.5 49C39.5 50 39 51 38 52L26 52C25 51 24.5 50 24.5 49C26.5 48.5 29 48 32 48ZM25 55L39 55C38.5 56 37 57 35 57.5L29 57.5C27 57 25.5 56 25 55Z" />
  </svg>
);

const GreekBustAvatar: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <div
    className="flex-shrink-0 rounded-full flex items-center justify-center"
    style={{
      width: size + 6,
      height: size + 6,
      background: "linear-gradient(135deg, #c4a97d, #a08050)",
    }}
  >
    <GreekBustIcon size={size} className="text-[#1a1a1a]" />
  </div>
);

// ─── Quick Action Chips ────────────────────────────────────────────────

const QUICK_ACTIONS = [
  "How does Confirmd work?",
  "Manage my subscription",
  "Report an issue",
  "What is factuality scoring?",
];

// ─── Markdown-lite renderer (links & bold) ─────────────────────────────

function renderMessageContent(text: string): React.ReactNode {
  // Split into segments by markdown links and bold
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Look for markdown link [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    // Look for bold **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

    // Find the earliest match
    const linkIndex = linkMatch ? remaining.indexOf(linkMatch[0]) : Infinity;
    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;

    if (linkIndex === Infinity && boldIndex === Infinity) {
      // No more special formatting
      parts.push(remaining);
      break;
    }

    if (linkIndex <= boldIndex && linkMatch) {
      // Link comes first
      if (linkIndex > 0) {
        parts.push(remaining.slice(0, linkIndex));
      }
      parts.push(
        <a
          key={`link-${key++}`}
          href={linkMatch[2]}
          className="text-[#c4a97d] hover:text-[#d4b98d] underline underline-offset-2"
          target={linkMatch[2].startsWith("/") ? undefined : "_blank"}
          rel={linkMatch[2].startsWith("/") ? undefined : "noopener noreferrer"}
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkIndex + linkMatch[0].length);
    } else if (boldMatch) {
      // Bold comes first
      if (boldIndex > 0) {
        parts.push(remaining.slice(0, boldIndex));
      }
      parts.push(
        <strong key={`bold-${key++}`} className="font-semibold text-white">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldIndex + boldMatch[0].length);
    }
  }

  return parts;
}

function renderMessage(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {renderMessageContent(line)}
    </React.Fragment>
  ));
}

// ─── Typing Indicator ──────────────────────────────────────────────────

const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-2.5 max-w-[85%]">
    <GreekBustAvatar size={16} />
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 bg-[#c4a97d] rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-[#c4a97d] rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-[#c4a97d] rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  </div>
);

// ─── Escalation Form ───────────────────────────────────────────────────

const EscalationForm: React.FC<{
  defaultEmail: string;
  onSubmit: (email: string, description: string) => void;
  isSubmitting: boolean;
}> = ({ defaultEmail, onSubmit, isSubmitting }) => {
  const [email, setEmail] = useState(defaultEmail);
  const [description, setDescription] = useState("");

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
      <div className="text-xs font-semibold text-[#c4a97d] uppercase tracking-wider">
        Submit a Support Ticket
      </div>
      <div>
        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#c4a97d] transition-colors"
        />
      </div>
      <div>
        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
          Describe the issue
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please describe what you're experiencing..."
          rows={3}
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#c4a97d] transition-colors resize-none"
        />
      </div>
      <button
        onClick={() => onSubmit(email, description)}
        disabled={!email.trim() || !description.trim() || isSubmitting}
        className="w-full bg-[#c4a97d] hover:bg-[#d4b98d] disabled:opacity-40 disabled:cursor-not-allowed text-[#1a1a1a] text-xs font-bold py-2 px-4 rounded-lg transition-colors"
      >
        {isSubmitting ? "Submitting..." : "Submit Ticket"}
      </button>
    </div>
  );
};

// ─── Billing Links ─────────────────────────────────────────────────────

const BillingLinks: React.FC = () => (
  <div className="flex flex-wrap gap-2 mt-2">
    <a
      href="/plus"
      className="inline-flex items-center gap-1.5 bg-[#c4a97d]/15 hover:bg-[#c4a97d]/25 text-[#c4a97d] text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      Upgrade Plan
    </a>
    <a
      href="/plus"
      className="inline-flex items-center gap-1.5 bg-[var(--bg-card-hover)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      View Invoices
    </a>
    <a
      href="/plus"
      className="inline-flex items-center gap-1.5 bg-[var(--bg-card-hover)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Manage Subscription
    </a>
  </div>
);

// ─── Main FirmyChat Component ──────────────────────────────────────────

const FirmyChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, showEscalation, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const addMessage = useCallback(
    (role: ChatMessage["role"], content: string) => {
      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setInput("");
      setShowEscalation(false);
      setLastAction(null);
      addMessage("user", trimmed);
      setIsTyping(true);

      try {
        const history = messages.map((m) => ({
          role: m.role === "firmy" ? "assistant" : m.role,
          content: m.content,
        }));

        const res = await fetch("/api/support/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
        });

        if (!res.ok) throw new Error("Chat request failed");

        const data = await res.json();

        // Simulate a brief thinking delay for natural feel
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));

        setIsTyping(false);
        addMessage("firmy", data.reply);

        if (data.action) {
          setLastAction(data.action);
          if (data.action === "show_escalation_form") {
            setShowEscalation(true);
          }
        }
      } catch {
        setIsTyping(false);
        addMessage(
          "firmy",
          "I apologize, but I seem to be experiencing a temporary difficulty. Please try again in a moment, or visit our [FAQ](/faq) for answers to common questions."
        );
      }
    },
    [messages, addMessage]
  );

  const handleEscalationSubmit = useCallback(
    async (email: string, description: string) => {
      setIsSubmittingEscalation(true);
      try {
        const res = await fetch("/api/support/escalate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            description,
            userId: user?.id || undefined,
          }),
        });

        if (!res.ok) throw new Error("Escalation failed");

        setShowEscalation(false);
        setIsSubmittingEscalation(false);
        addMessage(
          "system",
          "Your issue has been forwarded to our team. We'll respond via email."
        );
      } catch {
        setIsSubmittingEscalation(false);
        addMessage(
          "firmy",
          "I was unable to submit your ticket at this time. Please try again, or email us directly at support@confirmd.com."
        );
      }
    },
    [user, addMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* ── Chat Panel ─────────────────────────────────────────────── */}
      <div
        className={`fixed z-[9999] transition-all duration-300 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        } bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[min(70vh,560px)]`}
      >
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[min(70vh,560px)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a1a1a] to-[#242424] px-4 py-3 flex items-center justify-between flex-shrink-0 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2.5">
              <GreekBustAvatar size={18} />
              <div>
                <div className="text-sm font-bold text-white leading-tight">
                  Firmy
                </div>
                <div className="text-[10px] text-[#c4a97d] font-medium">
                  AI Support
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Close chat"
            >
              <svg
                className="w-4 h-4"
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

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {/* Welcome message if no messages yet */}
            {!hasMessages && (
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 max-w-[85%]">
                  <GreekBustAvatar size={16} />
                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                      Greetings! I am{" "}
                      <span className="font-semibold text-[#c4a97d]">
                        Firmy
                      </span>
                      , your guide to Confirmd. How may I assist you today?
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pl-9 flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action}
                      onClick={() => sendMessage(action)}
                      className="text-[11px] font-medium text-[#c4a97d] bg-[#c4a97d]/10 hover:bg-[#c4a97d]/20 border border-[#c4a97d]/20 hover:border-[#c4a97d]/40 rounded-full px-3 py-1.5 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[80%] bg-[#c4a97d] text-[#1a1a1a] rounded-2xl rounded-tr-sm px-4 py-2.5">
                      <p className="text-xs font-medium leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              }

              if (msg.role === "system") {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-2 max-w-[90%]">
                      <p className="text-[11px] text-[var(--text-muted)] text-center leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              }

              // Firmy message
              return (
                <div key={msg.id} className="flex items-start gap-2.5 max-w-[85%]">
                  <GreekBustAvatar size={16} />
                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
                      {renderMessage(msg.content)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && <TypingIndicator />}

            {/* Billing Links (shown after billing-related responses) */}
            {lastAction === "show_billing_links" && !isTyping && (
              <div className="pl-9">
                <BillingLinks />
              </div>
            )}

            {/* Escalation Form */}
            {showEscalation && !isTyping && (
              <div className="pl-9">
                <EscalationForm
                  defaultEmail={user?.email || ""}
                  onSubmit={handleEscalationSubmit}
                  isSubmitting={isSubmittingEscalation}
                />
              </div>
            )}

            {/* Suggest Escalation Button */}
            {lastAction === "suggest_escalation" && !isTyping && !showEscalation && (
              <div className="pl-9">
                <button
                  onClick={() => setShowEscalation(true)}
                  className="text-[11px] font-medium text-[#c4a97d] bg-[#c4a97d]/10 hover:bg-[#c4a97d]/20 border border-[#c4a97d]/20 hover:border-[#c4a97d]/40 rounded-full px-3 py-1.5 transition-colors"
                >
                  Submit a support ticket
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-[var(--border-color)] px-3 py-3 bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Firmy anything..."
                disabled={isTyping}
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#c4a97d] transition-colors disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="flex-shrink-0 w-9 h-9 bg-[#c4a97d] hover:bg-[#d4b98d] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
                aria-label="Send message"
              >
                <svg
                  className="w-4 h-4 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[9px] text-[var(--text-muted)]">
                Firmy is an AI assistant and may not always be accurate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Button ────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-[9999] group">
        {/* Tooltip */}
        <div
          className={`absolute bottom-full right-0 mb-2 pointer-events-none transition-opacity duration-200 ${
            isOpen ? "opacity-0" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <div className="bg-[#1a1a1a] text-white text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-700">
            Ask Firmy
            <div className="absolute top-full right-4 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#1a1a1a]" />
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
            isOpen
              ? "bg-[var(--bg-card)] border border-[var(--border-color)] rotate-0 scale-95"
              : "bg-gradient-to-br from-[#c4a97d] to-[#a08050] hover:from-[#d4b98d] hover:to-[#b09060] scale-100"
          }`}
          aria-label={isOpen ? "Close Firmy chat" : "Open Firmy chat"}
        >
          {/* Pulse ring animation when idle and closed */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-[#c4a97d] animate-ping opacity-20" />
          )}

          {isOpen ? (
            <svg
              className="w-5 h-5 text-[var(--text-primary)]"
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
            <GreekBustIcon size={28} className="text-[#1a1a1a] relative z-10" />
          )}
        </button>
      </div>
    </>
  );
};

export default FirmyChat;
