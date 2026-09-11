import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Send,
  Bot,
  User as UserIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Check,
  Download,
  Trash2,
  PlusCircle,
  Cpu,
  Brain,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Assignment } from "@/lib/assignments";
import {
  processAIMessage,
  AIMessage,
  AIContext,
  AIModelType,
  detectLanguage,
} from "@/lib/ai-assistant";

interface AICopilotProps {
  assignments: Assignment[];
  notices: Array<{ id: string; title: string; message: string; created_at: string }>;
  onAddAssignment?: (assignment: Partial<Assignment>) => Promise<void> | void;
}

const MODELS: Array<{ id: AIModelType; name: string; icon: any; desc: string; badge: string }> = [
  {
    id: "studyboard",
    name: "CampusSync OS Engine",
    icon: Sparkles,
    desc: "Fastest • Realtime Deadlines, Checking & Notice tracking",
    badge: "Default",
  },
  {
    id: "gpt4o",
    name: "GPT-4o Academic",
    icon: Zap,
    desc: "Code, math, structured explanations & coursework help",
    badge: "Pro",
  },
  {
    id: "claude",
    name: "Claude 3.7 Sonnet",
    icon: Brain,
    desc: "Study planning, pedagogical clarity & timetables",
    badge: "Mentor",
  },
  {
    id: "deepseek",
    name: "DeepSeek R1",
    icon: Cpu,
    desc: "Deep reasoning, step-by-step logic & problem solving",
    badge: "Reasoning",
  },
];

export function AICopilot({ assignments, notices, onAddAssignment }: AICopilotProps) {
  const { profile, user, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelType>("studyboard");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome-1",
      sender: "ai",
      timestamp: new Date().toISOString(),
      model: "studyboard",
      text: `👋 **Namaste ${profile?.name?.split(" ")[0] || "Student"}!** Main hoon aapka **CampusSync College AI Copilot** (Thakur Shyamnarayan Degree College).\n\nAap mujhse **Hindi, Hinglish, ya English** me kuch bhi pooch sakte ho:\n\n• 🚨 *"Kal kya checking aur submit karna hai?"*\n• 📢 *"Aaj ke date pe koi important notice ya circular aaya hai?"*\n• 🔬 *"Practical journal checking kab aur kaha hai?"*\n• 👩‍🏫 *"Abha Ma'am ne class me kya bola tha?"*\n• 📊 *"Bhai mera kya pending hai aur timetable bana do"*\n\nNeeche diye prompt chips par click karke direct try karo!`,
      suggestedPrompts: [
        "🚨 Kal kya checking aur submission hai?",
        "📢 Aaj ka important circular kya hai?",
        "👩‍🏫 Abha Ma'am ne class me kya bola?",
        "📊 Bhai mera kya pending hai?",
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN"; // Supports English/Hinglish/Hindi accents

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error("Voice recognition failed. You can type your request directly.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [assignments, notices, selectedModel]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.info("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("Listening... Speak in Hindi, Hinglish or English!");
      } catch {
        setIsListening(false);
      }
    }
  };

  // Text to Speech
  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) {
      toast.info("Text-to-speech not supported in this browser.");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*_#`>•]/g, "").replace(/\n+/g, ". ");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const lang = detectLanguage(cleanText);
    if (lang === "hindi" || lang === "hinglish") {
      utterance.lang = "hi-IN";
    } else {
      utterance.lang = "en-US";
    }
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (customQuery?: string) => {
    const query = (customQuery || input).trim();
    if (!query) return;

    const userMsg: AIMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    let classInstructions: any[] = [];
    try {
      const stored = localStorage.getItem("studyboard_class_instructions");
      if (stored) classInstructions = JSON.parse(stored);
    } catch {
      // Ignore local storage parsing error
    }

    const context: AIContext = {
      assignments,
      notices,
      classInstructions,
      userName: profile?.name || user?.email || "Student",
      userRole: role || "student",
      model: selectedModel,
    };

    try {
      setTimeout(async () => {
        const aiResponse = await processAIMessage(query, context);
        setMessages((prev) => [...prev, aiResponse]);
        setIsTyping(false);
      }, 400);
    } catch {
      setIsTyping(false);
      toast.error("Error generating AI response");
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  const handleExecuteAction = async (msg: AIMessage) => {
    if (msg.action?.type === "create_assignment" && msg.action.payload) {
      if (onAddAssignment) {
        await onAddAssignment(msg.action.payload);
        toast.success(`Assignment "${msg.action.payload.title}" added to StudyBoard!`);
      } else {
        toast.success("Assignment saved to workspace!");
      }
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "ai",
        timestamp: new Date().toISOString(),
        model: selectedModel,
        text: "✨ Conversation reset. Main aapki aur kya help kar sakta hoon?",
        suggestedPrompts: [
          "📊 Bhai mera kya pending hai?",
          "📅 Aaj ka timetable banao",
          "📢 Naya notice kya aaya hai?",
        ],
      },
    ]);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const exportChat = () => {
    const chatText = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender.toUpperCase()} (${m.model || "ai"}):\n${m.text}\n`,
      )
      .join("\n---\n\n");
    const blob = new Blob([chatText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StudyBoard-Copilot-${selectedModel}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Study plan & chat exported!");
  };

  const activeModelObj = MODELS.find((m) => m.id === selectedModel) || MODELS[0]!;

  return (
    <>
      {/* Launcher Floating Button */}
      {!isOpen && (
        <aside aria-label="AI Study Assistant Launcher">
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 px-4 py-3 text-sm font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/30 active:scale-95 sm:px-5 sm:py-3.5"
            aria-label="Open AI Study Assistant"
          >
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-300 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-sky-400" />
            </span>
            <Sparkles className="size-4 animate-spin-slow text-amber-300" />
            <span className="tracking-wide">AI Study Copilot</span>
            <span className="hidden sm:inline-block rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] uppercase font-bold">
              {activeModelObj.badge}
            </span>
          </button>
        </aside>
      )}

      {/* OS Floating Window */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden border border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
            isExpanded
              ? "inset-4 md:inset-10 rounded-2xl"
              : "bottom-5 right-5 h-[620px] w-[95vw] sm:w-[450px] rounded-3xl"
          }`}
        >
          {/* OS Window Header */}
          <div className="flex flex-col border-b border-border/60 bg-muted/40 px-4 py-2.5 select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Traffic light OS buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="size-3 rounded-full bg-rose-500 hover:opacity-80 transition-opacity"
                    title="Close"
                  />
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="size-3 rounded-full bg-amber-500 hover:opacity-80 transition-opacity"
                    title="Restore"
                  />
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="size-3 rounded-full bg-emerald-500 hover:opacity-80 transition-opacity"
                    title="Maximize"
                  />
                </div>

                {/* Model Selector Trigger */}
                <div className="relative ml-2">
                  <button
                    onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-card/80 px-2.5 py-1 text-xs font-bold text-foreground shadow-2xs hover:border-primary/60 transition-all"
                  >
                    <activeModelObj.icon className="size-3.5 text-primary" />
                    <span>{activeModelObj.name}</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[9px] text-primary">
                      {activeModelObj.badge}
                    </span>
                  </button>

                  {/* Dropdown Options */}
                  {modelDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-64 rounded-2xl border border-border bg-popover p-1.5 shadow-xl z-50">
                      <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Select Academic Model
                      </p>
                      {MODELS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedModel(m.id);
                            setModelDropdownOpen(false);
                            toast.info(`Switched model to ${m.name}`);
                          }}
                          className={`flex w-full items-start gap-2.5 rounded-xl p-2 text-left transition-all ${
                            selectedModel === m.id
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <m.icon className="size-4 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span>{m.name}</span>
                              <span className="text-[9px] opacity-75">{m.badge}</span>
                            </div>
                            <p className="line-clamp-1 text-[10px] opacity-80 mt-0.5">{m.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Window action buttons */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={clearChat}
                  title="Clear conversation"
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={exportChat}
                  title="Export study plan"
                >
                  <Download className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Restore size" : "Maximize"}
                >
                  {isExpanded ? (
                    <Minimize2 className="size-3.5" />
                  ) : (
                    <Maximize2 className="size-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAi ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl font-bold shadow-sm ${
                      isAi
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground border border-border"
                    }`}
                  >
                    {isAi ? <Bot className="size-4" /> : <UserIcon className="size-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs ${
                      isAi
                        ? "bg-card border border-border/70 text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {isAi && (
                      <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/40 pb-1 text-[10px] text-muted-foreground">
                        <span className="font-semibold text-primary capitalize flex items-center gap-1">
                          <Sparkles className="size-2.5" />
                          {msg.model ? msg.model.toUpperCase() : "STUDYBOARD"}
                        </span>
                        {msg.language && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-[9px] uppercase tracking-wider">
                            🌐{" "}
                            {msg.language === "hindi"
                              ? "हिन्दी"
                              : msg.language === "hinglish"
                                ? "Hinglish"
                                : "English"}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="whitespace-pre-line leading-relaxed text-[13px]">
                      {msg.text}
                    </div>

                    {/* Action Card (e.g. Save Assignment) */}
                    {msg.action?.type === "create_assignment" && msg.action.payload && (
                      <div className="mt-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
                        <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <PlusCircle className="size-3.5" /> Ready to add to your assignments:
                        </p>
                        <div className="mt-2 text-xs space-y-0.5 text-muted-foreground">
                          <p>
                            <span className="font-semibold text-foreground">Subject:</span>{" "}
                            {msg.action.payload.subject}
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">Title:</span>{" "}
                            {msg.action.payload.title}
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">Deadline:</span>{" "}
                            {msg.action.payload.deadline}
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">Priority:</span>{" "}
                            {msg.action.payload.priority}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="mt-3 w-full gap-1.5 text-xs h-8 rounded-lg"
                          onClick={() => handleExecuteAction(msg)}
                        >
                          <Check className="size-3.5" /> Confirm &amp; Save Assignment
                        </Button>
                      </div>
                    )}

                    {/* Footer for AI messages: Timestamp & Audio Read Button */}
                    {isAi && (
                      <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-1.5 text-[11px] text-muted-foreground">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <button
                          onClick={() => speakText(msg.text)}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                          title="Listen to audio response"
                        >
                          {isSpeaking ? (
                            <VolumeX className="size-3 text-rose-500" />
                          ) : (
                            <Volume2 className="size-3 text-primary" />
                          )}
                          <span>Read</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Bot className="size-4" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-xs">
                  <span className="size-2 animate-bounce rounded-full bg-primary" />
                  <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:0.2s]" />
                  <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:0.4s]" />
                  <span className="ml-2 text-xs text-muted-foreground font-medium">
                    Thinking ({activeModelObj.name})...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompt Chips */}
          {(() => {
            const lastMsg = messages[messages.length - 1];
            if (!lastMsg?.suggestedPrompts || lastMsg.suggestedPrompts.length === 0) return null;
            return (
              <div className="border-t border-border/50 bg-muted/20 px-3 py-2">
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {lastMsg.suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickPrompt(p)}
                      className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-foreground shadow-2xs hover:border-primary/60 hover:bg-primary/5 hover:text-primary transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-border/60 bg-background p-3"
          >
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={isListening ? "destructive" : "ghost"}
                size="icon"
                onClick={toggleListening}
                className="size-9 shrink-0 rounded-xl"
                title={isListening ? "Stop listening" : "Voice input (Hindi/English/Hinglish)"}
              >
                {isListening ? (
                  <MicOff className="size-4 animate-pulse" />
                ) : (
                  <Mic className="size-4" />
                )}
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isListening
                    ? "Listening... bolo kya poochna hai"
                    : "Poocho Hindi, Hinglish ya English me..."
                }
                className="h-10 flex-1 rounded-xl bg-muted/40 text-xs sm:text-sm focus-visible:ring-1"
              />

              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isTyping}
                className="size-9 shrink-0 rounded-xl font-bold"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
