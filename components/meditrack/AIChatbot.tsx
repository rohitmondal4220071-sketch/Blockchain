"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Info, Loader2, Send, Sparkles, Trash2, User } from "lucide-react";
import { storageService, type ChatMessage, type UserProfile } from "@/lib/storage";
import { GlassCard, GlassInput } from "./ui";

interface AIChatbotProps {
  user: UserProfile;
}

/** Builds a short health-context string so the AI can personalize answers. */
function buildContext(user: UserProfile): string {
  const parts: string[] = [];
  if (user.name) parts.push(`Name: ${user.name}`);
  if (user.height && user.weight) {
    const bmi = (user.weight / Math.pow(user.height / 100, 2)).toFixed(1);
    parts.push(`Height: ${user.height}cm, Weight: ${user.weight}kg, BMI: ${bmi}`);
  }
  const meds = storageService.getMedicines();
  if (meds.length > 0) {
    const pending = meds.filter((m) => !m.taken).map((m) => m.name);
    parts.push(
      `Medications: ${meds.length} total, ${pending.length} pending today${
        pending.length ? ` (${pending.join(", ")})` : ""
      }`
    );
  }
  const water = storageService.getTodayWaterLog();
  if (water) parts.push(`Water today: ${water.amount}ml of ${water.goal}ml goal`);
  if (user.conditions?.length && !user.conditions.includes("None"))
    parts.push(`Conditions: ${user.conditions.join(", ")}`);
  if (user.allergies?.length && !user.allergies.includes("None"))
    parts.push(`Allergies: ${user.allergies.join(", ")}`);
  return parts.join(". ");
}

/** Local rule-based fallback used when the Claude route is unavailable. */
async function localAIResponse(message: string, user: UserProfile): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 600));
  const m = message.toLowerCase();

  if (m.includes("bmi") || m.includes("weight")) {
    if (user.height && user.weight) {
      const bmi = (user.weight / Math.pow(user.height / 100, 2)).toFixed(1);
      const v = parseFloat(bmi);
      const note =
        v < 18.5
          ? "This falls in the underweight category. Consider consulting a nutritionist."
          : v < 25
            ? "Great news! This is within the healthy range. Keep it up!"
            : v < 30
              ? "This falls in the overweight category. Consider more activity and a diet review."
              : "This indicates obesity. Please consult a healthcare provider for guidance.";
      return `Based on your profile, your BMI is approximately ${bmi}. ${note}`;
    }
    return "I don't have your height and weight yet. Add them in onboarding or use the BMI Calculator.";
  }

  if (m.includes("medicine") || m.includes("medication") || m.includes("pill")) {
    const medicines = storageService.getMedicines();
    if (medicines.length > 0) {
      const pending = medicines.filter((x) => !x.taken);
      if (pending.length > 0) {
        return `You have ${pending.length} medication${pending.length > 1 ? "s" : ""} pending today: ${pending
          .map((x) => x.name)
          .join(", ")}. Consistent adherence is key!`;
      }
      return "Excellent! You've taken all your medications for today.";
    }
    return "You don't have any medications scheduled yet. Add them in Medicine, or scan a prescription.";
  }

  if (m.includes("water") || m.includes("hydrat")) {
    const log = storageService.getTodayWaterLog();
    if (log) {
      const pct = Math.round((log.amount / log.goal) * 100);
      return `You've consumed ${log.amount}ml today, ${pct}% of your ${log.goal}ml goal. ${
        pct >= 100 ? "Goal met!" : "Keep drinking — hydration matters."
      }`;
    }
    return "No water intake data yet. Head to Hydration to start tracking!";
  }

  if (m.includes("sleep"))
    return "Adults should aim for 7-9 hours per night. Keep a consistent schedule, avoid screens before bed, and limit caffeine after noon.";
  if (m.includes("exercise") || m.includes("workout") || m.includes("fitness"))
    return "Aim for at least 150 minutes of moderate aerobic activity per week. Even a 10-minute walk helps!";
  if (m.includes("stress") || m.includes("anxious") || m.includes("anxiety"))
    return "Try deep breathing (4-7-8), progressive muscle relaxation, or a short walk. If stress persists, consider speaking with a professional.";
  if (m.includes("diet") || m.includes("nutrition") || m.includes("eat"))
    return "A balanced diet includes fruits, vegetables, whole grains, lean proteins, and healthy fats. Small sustainable changes work best.";
  if (m.includes("hello") || m.includes("hi") || m.includes("hey"))
    return `Hello ${user.name}! I'm your MediScan AI assistant. I can help with medications, BMI, hydration, and general wellness. How can I assist?`;
  if (m.includes("thank")) return "You're welcome! I'm here to help on your health journey.";

  const defaults = [
    "Great question! For complex health concerns, consult a healthcare professional. I can help track medications, hydration, and wellness — what would you like to know?",
    "Thanks for sharing. For medical advice, please see a doctor. Meanwhile, I can help with daily health tracking. What can I do for you?",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

/**
 * Tries the server-side Claude chat route first; on any failure (no API key,
 * network, etc.) falls back to the local rule-based assistant. Returns the
 * reply text plus which engine produced it.
 */
async function generateAIResponse(
  history: ChatMessage[],
  message: string,
  user: UserProfile,
  language: string
): Promise<{ text: string; mode: "ai" | "local" }> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: `${buildContext(user)}. IMPORTANT: Reply in ${language} language.`,
        messages: [
          ...history
            .filter((h) => h.id !== "welcome")
            .map((h) => ({ role: h.role, content: h.content })),
          { role: "user", content: message },
        ],
      }),
    });
    const data = (await res.json()) as { available: boolean; reply?: string };
    if (data.available && data.reply) {
      return { text: data.reply, mode: "ai" };
    }
  } catch {
    /* fall through to local */
  }
  const text = await localAIResponse(message, user);
  return { text, mode: "local" };
}

export function AIChatbot({ user }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"ai" | "local" | null>(null);
  const [language, setLanguage] = useState<"English" | "Hindi" | "Bengali">(() => {
    if (typeof window === "undefined") return "English";
    return (localStorage.getItem("mediscan_ai_language") as "English" | "Hindi" | "Bengali") || "English";
  });
  const endRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (lang: "English" | "Hindi" | "Bengali") => {
    setLanguage(lang);
    localStorage.setItem("mediscan_ai_language", lang);
  };

  useEffect(() => {
    const saved = storageService.getChatHistory();
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello ${user.name}, I'm Dr. MediScan, your AI health assistant. Tell me what's bothering you or ask any health question — I'll review it with you like a doctor would. How are you feeling today?`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [user.name]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setIsLoading(true);
    try {
      const { text, mode: usedMode } = await generateAIResponse(messages, userMessage.content, user, language);
      setMode(usedMode);
      const assistant: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: text,
        timestamp: new Date().toISOString(),
      };
      const final = [...updated, assistant];
      setMessages(final);
      storageService.saveChatHistory(final);
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    storageService.clearChatHistory();
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hello ${user.name}! Chat history cleared. How can I help you today?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const quickQuestions = [
    "How much water should I drink?",
    "What are my medications for today?",
    "Give me a health tip",
    "How can I sleep better?",
  ];

  return (
    <div className="flex h-[calc(100vh-240px)] min-h-[480px] flex-col gap-4">
      <GlassCard className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Sparkles className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-medium text-white">MediScan AI Assistant</h2>
            <p className="text-xs text-white/50">
              {mode === "ai"
                ? "Powered by Claude Opus"
                : mode === "local"
                  ? "Built-in assistant (demo)"
                  : "Always here to help"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="flex items-center gap-1 rounded-full bg-white/5 p-0.5">
            {(["English", "Hindi", "Bengali"] as const).map(lang => (
              <button
                key={lang}
                onClick={() => changeLanguage(lang)}
                className={`rounded-full px-2 py-1 text-[10px] font-medium transition ${language === lang ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"}`}
              >
                {lang === "English" ? "EN" : lang === "Hindi" ? "हि" : "বা"}
              </button>
            ))}
          </div>
          {mode && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">
              {mode === "ai" ? "AI Mode" : "Demo Mode"}
            </span>
          )}
          <button
            onClick={clear}
            aria-label="Clear chat history"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </GlassCard>

      <div className="liquid-glass flex flex-1 flex-col overflow-hidden rounded-[1.5rem]">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                {msg.role === "assistant" ? (
                  <Bot className="h-4 w-4 text-white" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
              <div className={`max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`inline-block rounded-2xl p-3 ${
                    msg.role === "assistant"
                      ? "rounded-tl-none bg-white/10 text-white"
                      : "rounded-tr-none bg-white/20 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
                <p className="mt-1 px-1 text-[10px] text-white/40">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-white/10 p-3">
                <div className="flex items-center gap-2 text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length < 3 && (
          <div className="px-4 pb-2">
            <p className="mb-2 text-xs text-white/50">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-white/10 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <GlassInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your health…"
              disabled={isLoading}
              className="flex-1"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="liquid-glass glass-glow flex h-11 w-11 items-center justify-center rounded-xl text-white outline-none transition focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-white/5 p-3 text-xs text-white/50">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          This AI assistant provides general health information only. Always consult a healthcare
          professional for medical advice, diagnosis, or treatment.
        </p>
      </div>
    </div>
  );
}
