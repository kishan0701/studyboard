import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  CalendarRange,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Plus,
  BookOpen,
  Calendar,
  Activity,
  Check,
  Smartphone,
  Copy,
  Send,
  GraduationCap,
  Pin,
  Trash2,
  Filter,
  Flame,
  FileText,
  UserCheck,
  Megaphone,
  Bell,
  MessageSquareQuote,
  CheckSquare,
  Search,
  Play,
  Pause,
  RotateCcw,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { StorageService } from "@/lib/storage-service";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Daily Action Hub & Notice Intelligence — StudyBoard" },
      {
        name: "description",
        content:
          "AI-powered date-wise action planner and official circular broadcaster for Thakur Shyamnarayan Degree College.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile, role } = useAuth();

  if (role === "admin") {
    return <FacultyDashboard user={user} profile={profile} />;
  }

  return <StudentDashboard user={user} profile={profile} />;
}

// ============================================================================
// TYPES FOR DAILY ACTION HUB & IN-CLASS NOTES
// ============================================================================
interface ActionItem {
  id: string;
  type: "notice" | "in_class" | "personal";
  title: string;
  subject: string;
  profName: string;
  targetDate: string; // YYYY-MM-DD
  urgency: "critical" | "important" | "normal";
  completed: boolean;
  pinned: boolean;
  personalNote?: string;
  createdAt: string;
}

const STORAGE_IN_CLASS_KEY = "studyboard_class_instructions";
function useLiveClock() {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      );
      setDateStr(
        now.toLocaleDateString([], {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return { timeStr, dateStr };
}

function OsStatusBar({ role, onToggleRole }: { role: string; onToggleRole: () => void }) {
  const { timeStr, dateStr } = useLiveClock();

  return (
    <div className="mb-6 rounded-2xl border border-border/80 bg-card/75 backdrop-blur-md p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-black text-xs">
          💻
        </div>
        <div className="flex items-center gap-2">
          <strong className="text-xs font-display font-bold text-foreground">CampusSync OS</strong>
          <span className="text-[10px] font-extrabold uppercase bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
            v2.4
          </span>
          <span className="hidden sm:inline text-[11px] text-muted-foreground font-medium">
            • TSDC Academic Station (TYCS Sem 5)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
        <div className="hidden md:flex items-center gap-2 text-muted-foreground font-mono text-[11px] bg-muted/60 px-2.5 py-1 rounded-lg">
          <Clock3 className="size-3 text-primary" />
          <span>{dateStr || "Fri, 11 Sep 2026"}</span>
          <span className="text-foreground font-bold">{timeStr || "12:00:00 PM"}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Campus Mesh Synced</span>
        </div>

        <button
          type="button"
          onClick={onToggleRole}
          className="rounded-xl border border-border bg-background hover:bg-muted/80 px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors flex items-center gap-1 shadow-2xs"
        >
          <span>{role === "admin" ? "👨‍🏫 Faculty View" : "🎓 Student View"}</span>
          <span className="text-[9px] text-primary underline">Switch</span>
        </button>
      </div>
    </div>
  );
}

function getTodayStr(): string {
  const d = new Date();
  return d.toISOString().split("T")[0] ?? "";
}

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0] ?? "";
}

function getDatePlusDaysStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0] ?? "";
}

// Initial seed items for in-class teacher instructions
const DEFAULT_IN_CLASS_NOTES: ActionItem[] = [
  {
    id: "ic-0",
    type: "in_class",
    title:
      "TYCS Mini Project Progress Presentation in Room 701 (12:15 PM) — Present 13 points with prototype",
    subject: "TYCS Mini Project",
    profName: "Mrs. Abha Dhote (CS HOD) & Dr. G.D. Giri",
    targetDate: "2026-10-10",
    urgency: "critical",
    completed: false,
    pinned: true,
    personalNote:
      "Pen drive with PPT, spiral project draft, source code & live prototype ready for verification",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ic-1",
    type: "in_class",
    title: "Bring spiral-bound Black Book Chapter 1 & 2 draft with plagiarism report (< 10%)",
    subject: "Final Year Project",
    profName: "Mrs. Abha Dhote (CS HOD)",
    targetDate: getTomorrowStr(),
    urgency: "critical",
    completed: false,
    pinned: true,
    personalNote: "Print 2 copies at college xerox shop before 9:00 AM",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ic-2",
    type: "in_class",
    title: "Submit DBMS Lab 4 ER Diagram hard copy signed in practical journal",
    subject: "Database Management",
    profName: "Prof. S. Sharma",
    targetDate: getTomorrowStr(),
    urgency: "critical",
    completed: false,
    pinned: false,
    personalNote: "Draw relational cardinality tables neatly with pencil",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ic-3",
    type: "in_class",
    title: "Prepare 5-slide PPT on Round Robin CPU Scheduling for in-class viva",
    subject: "Operating Systems",
    profName: "Prof. K. Mehta",
    targetDate: getDatePlusDaysStr(3),
    urgency: "important",
    completed: false,
    pinned: false,
    personalNote: "",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ic-4",
    type: "in_class",
    title: "Collect signed hall tickets from Room 304 after clearing fee receipt",
    subject: "Admin Office",
    profName: "Exam Cell / Principal Dr. G.D. Giri",
    targetDate: getDatePlusDaysStr(4),
    urgency: "important",
    completed: false,
    pinned: false,
    personalNote: "Keep ID card ready",
    createdAt: new Date().toISOString(),
  },
];

// ============================================================================
// 1. PROFESSOR / FACULTY AI NOTICE BROADCASTER
// ============================================================================
function FacultyDashboard({ user, profile }: { user: any; profile: any }) {
  const qc = useQueryClient();
  const { switchRole } = useAuth();

  const [rawText, setRawText] = useState(
    "Dear TYCS Students, Practical examination journal evaluation is scheduled for 12th Sep 2026. All students must submit certified DBMS & OS journals by 2:00 PM without fail. Late submissions will result in ZERO internal marks.",
  );

  const [noticeTitle, setNoticeTitle] = useState(
    "🚨 URGENT: Practical Journal Certification & Submission",
  );
  const [extractedDate, setExtractedDate] = useState(getTomorrowStr());
  const [extractedAction, setExtractedAction] = useState(
    "Submit certified DBMS & OS practical journals by 2:00 PM in Lab 3.",
  );
  const [urgency, setUrgency] = useState<"critical" | "important" | "normal">("critical");
  const [profName, setProfName] = useState(profile?.name || "Mrs. Abha Dhote (CS HOD)");
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const noticesQuery = useQuery({
    queryKey: ["notices"],
    queryFn: () => StorageService.fetchNotices(),
  });

  // AI Parser: Extracts date, action item, urgency from messy WhatsApp/circular text
  const runAiExtraction = () => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      const text = rawText.toLowerCase();

      // Simple heuristic date finder
      let detectedDate = getTomorrowStr();
      if (text.includes("today") || text.includes("aaj")) {
        detectedDate = getTodayStr();
      } else if (text.includes("tomorrow") || text.includes("kal")) {
        detectedDate = getTomorrowStr();
      } else if (text.includes("12") || text.includes("12th")) {
        detectedDate = "2026-09-12";
      } else if (text.includes("14") || text.includes("14th")) {
        detectedDate = "2026-09-14";
      } else if (text.includes("15") || text.includes("15th")) {
        detectedDate = "2026-09-15";
      } else if (text.includes("18") || text.includes("18th")) {
        detectedDate = "2026-09-18";
      }

      // Detect urgency
      let detectedUrgency: "critical" | "important" | "normal" = "important";
      if (
        text.includes("urgent") ||
        text.includes("mandatory") ||
        text.includes("compulsory") ||
        text.includes("zero") ||
        text.includes("fail") ||
        text.includes("strict")
      ) {
        detectedUrgency = "critical";
      } else if (text.includes("optional") || text.includes("feedback") || text.includes("info")) {
        detectedUrgency = "normal";
      }

      // Title & Action derivation
      let cleanTitle = "Official Notice: Academic Requirement";
      let cleanAction = rawText.slice(0, 160);

      if (text.includes("practical") || text.includes("journal")) {
        cleanTitle = "🚨 Mandatory Practical Journal Submission & Viva Verification";
        cleanAction = "Get practical journal signed by faculty and submit to Lab Assistant.";
      } else if (text.includes("attendance") || text.includes("hall ticket")) {
        cleanTitle = "⚠️ 75% Attendance Defaulter Clearance & Hall Ticket Distribution";
        cleanAction = "Report to Room 304 with parent undertaking to collect hall ticket.";
      } else if (text.includes("black book") || text.includes("project")) {
        cleanTitle = "📌 Black Book Final Year Project Spiral Draft Submission";
        cleanAction = "Submit Chapter 1 to 3 spiral bound draft with guide approval sign.";
      }

      setNoticeTitle(cleanTitle);
      setExtractedDate(detectedDate);
      setExtractedAction(cleanAction);
      setUrgency(detectedUrgency);
      setIsAiAnalyzing(false);
      toast.success("AI successfully extracted target date, action item & urgency!");
    }, 600);
  };

  const formattedWhatsAppBroadcast =
    `📢 *THAKUR SHYAMNARAYAN DEGREE COLLEGE (TSDC)*\n` +
    `*DEPARTMENT OF COMPUTER SCIENCE & IT*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 *${noticeTitle.toUpperCase()}*\n\n` +
    `🗓️ *TARGET CUTOFF DATE:* ${extractedDate} (${extractedDate === getTomorrowStr() ? "TOMORROW / KAL 🚨" : "STRICT DEADLINE"})\n` +
    `🚨 *PRIORITY:* ${urgency.toUpperCase()}\n` +
    `👨‍🏫 *ISSUED BY:* ${profName}\n\n` +
    `🎯 *WHAT YOU MUST DO BEFORE THIS DATE:*\n` +
    `👉 ${extractedAction}\n\n` +
    `ℹ️ *Details / Circular Text:*\n${rawText}\n\n` +
    `📱 *Pinned to your StudyBoard Daily Action Hub:* http://localhost:8080/dashboard\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const copyBroadcast = () => {
    navigator.clipboard.writeText(formattedWhatsAppBroadcast);
    setCopied(true);
    toast.success("WhatsApp broadcast text copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const publishNoticeMutation = useMutation({
    mutationFn: async () => {
      // 1. Insert official notice into storage
      const noticeBody = `${rawText}\n\n[AI Action: ${extractedAction} | Due: ${extractedDate} | Urgency: ${urgency.toUpperCase()} | Faculty: ${profName}]`;
      await StorageService.insertNotice(
        noticeTitle.trim(),
        noticeBody,
        user?.id || "faculty-admin",
      );

      // 2. Also register in student action items list so it auto-pins
      const rawActions = localStorage.getItem(STORAGE_IN_CLASS_KEY);
      const existing: ActionItem[] = rawActions ? JSON.parse(rawActions) : DEFAULT_IN_CLASS_NOTES;
      const newAction: ActionItem = {
        id: "notice-act-" + Date.now(),
        type: "notice",
        title: extractedAction || noticeTitle,
        subject: "Dept Circular",
        profName: profName,
        targetDate: extractedDate,
        urgency: urgency,
        completed: false,
        pinned: true,
        personalNote: "Official Notice from " + profName,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_IN_CLASS_KEY, JSON.stringify([newAction, ...existing]));
    },
    onSuccess: () => {
      toast.success("Notice published & auto-pinned to all students' Daily Action Hub!");
      void qc.invalidateQueries({ queryKey: ["notices"] });
    },
  });

  const loadPreset = (type: "journals" | "attendance" | "project") => {
    if (type === "journals") {
      setRawText(
        "All TYCS Section B students must get their DBMS and Operating Systems practical journals certified by 12th Sep 2026 before 2:00 PM. No entries permitted in lab without certified journal.",
      );
      setNoticeTitle("Mandatory Practical Journal Certification Before Lab Evaluation");
      setExtractedDate(getTomorrowStr());
      setExtractedAction("Bring signed DBMS and OS journal hard copies to Lab 2.");
      setUrgency("critical");
    } else if (type === "attendance") {
      setRawText(
        "Students having attendance below 75% are directed to meet HOD Mrs. Abha Dhote in Room 304 with their parents on 14th Sep 2026. Hall tickets will NOT be issued otherwise.",
      );
      setNoticeTitle("Defaulter Attendance Notice: Mandatory Parent Meeting for Hall Ticket");
      setExtractedDate(getDatePlusDaysStr(3));
      setExtractedAction("Report to Room 304 with parent undertaking letter to claim hall ticket.");
      setUrgency("critical");
    } else {
      setRawText(
        "Final Year Project Black Book documentation Chapter 1 to 3 must be submitted to project guide by 15th Sep 2026 with IEEE plagiarism certificate (< 10%).",
      );
      setNoticeTitle("Black Book Project Documentation Submission Deadline");
      setExtractedDate(getDatePlusDaysStr(4));
      setExtractedAction("Submit spiral bound project draft with Turnitin plagiarism report.");
      setUrgency("important");
    }
    toast.info("Circular preset loaded! Click 'AI Extract' or edit directly.");
  };

  return (
    <AppShell
      title="Faculty AI Notice & Circular Command Center 📢"
      subtitle="TSDC CS Department · Post circulars, auto-extract student action dates, and broadcast to student timelines."
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={copyBroadcast}
            variant="outline"
            className="rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 gap-1.5 font-semibold text-xs"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy WhatsApp Text"}
          </Button>
          <Button
            size="sm"
            onClick={() => publishNoticeMutation.mutate()}
            disabled={publishNoticeMutation.isPending}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm text-xs font-bold"
          >
            <Send className="size-3.5" />
            {publishNoticeMutation.isPending ? "Broadcasting..." : "Publish & Pin to Agendas"}
          </Button>
        </div>
      }
    >
      <OsStatusBar role="admin" onToggleRole={() => switchRole("student")} />

      {/* FACULTY HERO BANNER */}
      <div className="glass animate-fadeInUp p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="size-3.5 text-emerald-300" />
              <span>AI Date &amp; Action Intelligence · No Assignment Upload Clutter</span>
            </div>
            <h2 className="text-2xl font-display font-bold tracking-tight sm:text-3xl">
              Broadcast Circulars That Automatically Pin to Student Calendars
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Instead of notices getting lost in noisy WhatsApp groups, StudyBoard extracts the
              target date ("Is din ke pehle kya karna hai") and pins it directly to every student's
              daily action checklist with 1-day advance alerts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => loadPreset("journals")}
              variant="outline"
              className="rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              + Lab Journals
            </Button>
            <Button
              size="sm"
              onClick={() => loadPreset("attendance")}
              variant="outline"
              className="rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              + Attendance Warning
            </Button>
            <Button
              size="sm"
              onClick={() => loadPreset("project")}
              variant="outline"
              className="rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              + Black Book
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN TWO COLUMN COMPOSER & PREVIEW */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Left: AI Circular Composer */}
        <section className="glass animate-fadeInUp p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="size-4 text-emerald-600" />
              <h3 className="font-bold text-sm sm:text-base">
                1. Circular Text &amp; AI Extraction
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              Step 1 of 2
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">
                Paste WhatsApp Message / Circular Raw Text:
              </Label>
              <Textarea
                rows={4}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Type or paste circular text here..."
                className="rounded-xl text-xs font-sans leading-relaxed"
              />
            </div>

            <Button
              type="button"
              onClick={runAiExtraction}
              disabled={isAiAnalyzing || !rawText.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs gap-2 shadow-sm"
            >
              <Sparkles className="size-4" />
              {isAiAnalyzing
                ? "AI Analyzing Text & Extracting Dates..."
                : "⚡ AI Auto-Extract Date & Student Action Item"}
            </Button>

            {/* AI EXTRACTED STRUCTURED FIELDS */}
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                  <Sparkles className="size-3" /> AI Extracted Intelligence
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    urgency === "critical"
                      ? "bg-rose-500/15 text-rose-600"
                      : urgency === "important"
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-emerald-500/15 text-emerald-600"
                  }`}
                >
                  {urgency} Priority
                </span>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Notice Headline / Banner Title</Label>
                <Input
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="rounded-xl text-xs h-8 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold flex items-center gap-1 text-primary">
                    <Calendar className="size-3" /> Target Date ("Is Din Ke Pehle"):
                  </Label>
                  <Input
                    type="date"
                    value={extractedDate}
                    onChange={(e) => setExtractedDate(e.target.value)}
                    className="rounded-xl text-xs h-8 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Priority / Urgency Level</Label>
                  <select
                    value={urgency}
                    onChange={(e: any) => setUrgency(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 h-8 text-xs font-semibold"
                  >
                    <option value="critical">🚨 Critical / Compulsory</option>
                    <option value="important">⚠️ Important</option>
                    <option value="normal">ℹ️ Standard / Normal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">
                  Student Action Item ("Student Ko Kya Karna Hai"):
                </Label>
                <Input
                  value={extractedAction}
                  onChange={(e) => setExtractedAction(e.target.value)}
                  placeholder="Exact deliverable for student..."
                  className="rounded-xl text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Faculty In-Charge / Issuer:</Label>
                <Input
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="rounded-xl text-xs h-8"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right: WhatsApp Broadcast Generator & Student Timeline Preview */}
        <section className="glass animate-fadeInUp p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-emerald-600" />
                <h3 className="font-bold text-sm sm:text-base">
                  2. 1-Click WhatsApp Broadcast &amp; Preview
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 px-2 py-0.5 rounded-full">
                WhatsApp Ready
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                This exact notice will be pinned to all students' date-wise agendas with a 1-day
                warning alert, and formatted for your CR WhatsApp class group.
              </p>

              {/* LIVE WHATSAPP PREVIEW */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 dark:bg-emerald-950/40 p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto text-emerald-950 dark:text-emerald-100">
                {formattedWhatsAppBroadcast}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-border/60">
            <div className="flex gap-2">
              <Button
                onClick={copyBroadcast}
                variant="outline"
                className="flex-1 rounded-xl border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs gap-1.5"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied WhatsApp Text!" : "Copy WhatsApp Message"}
              </Button>
              <Button
                onClick={() => publishNoticeMutation.mutate()}
                disabled={publishNoticeMutation.isPending}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md"
              >
                <Send className="size-4" />
                {publishNoticeMutation.isPending
                  ? "Broadcasting..."
                  : "Publish to Daily Action Hub"}
              </Button>
            </div>
            <p className="text-[11px] text-center text-muted-foreground">
              Students will automatically see this in their "Tomorrow (Kal 🚨)" or targeted date
              agenda.
            </p>
          </div>
        </section>
      </div>

      {/* RECENTLY BROADCASTED NOTICES LOG */}
      <div className="mt-8 surface-card p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            <h3 className="font-bold text-base">Recently Broadcasted Circulars &amp; Agendas</h3>
          </div>
          <Link
            to="/notices"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            All notices <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-4 divide-y divide-border/60">
          {(noticesQuery.data ?? []).slice(0, 4).map((n: any) => (
            <div
              key={n.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                    CIRCULAR
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-foreground mt-1">{n.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(`📢 *${n.title}*\n${n.message}`);
                    toast.success("Copied to clipboard!");
                  }}
                >
                  <Copy className="size-3.5 mr-1" /> Copy Text
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ============================================================================
// 2. STUDENT DAILY ACTION HUB ("IS DIN KE PEHLE KYA KARNA HAI")
// ============================================================================
function StudentDashboard({ user, profile }: { user: any; profile: any }) {
  const { switchRole } = useAuth();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "today" | "tomorrow" | "week" | "in_class"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pomodoro Focus OS State
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroActive, setPomodoroActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (pomodoroActive && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroSeconds === 0 && pomodoroActive) {
      setPomodoroActive(false);
      toast.success("🎉 Focus Sprint Completed! Take a 5m breather.");
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroSeconds]);

  const togglePomodoro = () => {
    setPomodoroActive(!pomodoroActive);
  };

  const resetPomodoro = () => {
    setPomodoroActive(false);
    setPomodoroSeconds(25 * 60);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // In-class manual notes & combined action items
  const [items, setItems] = useState<ActionItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Note Form State
  const [newSubject, setNewSubject] = useState("Final Year Project");
  const [newProf, setNewProf] = useState("Mrs. Abha Dhote (CS HOD)");
  const [newTask, setNewTask] = useState("");
  const [newDate, setNewDate] = useState(getTomorrowStr());
  const [newUrgency, setNewUrgency] = useState<"critical" | "important" | "normal">("critical");
  const [newNote, setNewNote] = useState("");

  // Sub-note editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");

  // Load action items from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_IN_CLASS_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        setItems(DEFAULT_IN_CLASS_NOTES);
        localStorage.setItem(STORAGE_IN_CLASS_KEY, JSON.stringify(DEFAULT_IN_CLASS_NOTES));
      }
    } catch {
      setItems(DEFAULT_IN_CLASS_NOTES);
    }
  }, []);

  // Save changes helper
  const updateAndSave = (next: ActionItem[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_IN_CLASS_KEY, JSON.stringify(next));
  };

  // Toggle complete
  const toggleComplete = (id: string) => {
    const next = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    updateAndSave(next);
    toast.success("Action item updated!");
  };

  // Toggle pinned
  const togglePinned = (id: string) => {
    const next = items.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item));
    updateAndSave(next);
    toast.info("Pin state updated");
  };

  // Delete manual item
  const deleteItem = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    updateAndSave(next);
    toast.info("Item removed from your agenda");
  };

  // Add new in-class instruction
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) {
      toast.error("Please enter what the professor instructed!");
      return;
    }

    const newItem: ActionItem = {
      id: "ic-" + Date.now(),
      type: "in_class",
      title: newTask.trim(),
      subject: newSubject.trim() || "General Academic",
      profName: newProf.trim() || "Faculty Member",
      targetDate: newDate,
      urgency: newUrgency,
      completed: false,
      pinned: false,
      personalNote: newNote.trim(),
      createdAt: new Date().toISOString(),
    };

    const next = [newItem, ...items];
    updateAndSave(next);
    setNewTask("");
    setNewNote("");
    setShowAddModal(false);
    toast.success("In-Class instruction added to your Date-Wise Action Hub!");
  };

  // Save personal sub-note
  const savePersonalSubNote = (id: string) => {
    const next = items.map((item) =>
      item.id === id ? { ...item, personalNote: tempNoteText } : item,
    );
    updateAndSave(next);
    setEditingNoteId(null);
    toast.success("Personal reminder saved!");
  };

  const todayStr = getTodayStr();
  const tomorrowStr = getTomorrowStr();

  // Tomorrow count for 1-day warning
  const dueTomorrowItems = items.filter((i) => i.targetDate === tomorrowStr && !i.completed);
  const dueTodayItems = items.filter((i) => i.targetDate === todayStr && !i.completed);

  // Filter items
  const filteredItems = items
    .filter((i) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          i.title.toLowerCase().includes(q) ||
          i.subject.toLowerCase().includes(q) ||
          i.profName.toLowerCase().includes(q) ||
          (i.personalNote && i.personalNote.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Tab filter
      if (activeFilter === "today") return i.targetDate === todayStr;
      if (activeFilter === "tomorrow") return i.targetDate === tomorrowStr;
      if (activeFilter === "in_class") return i.type === "in_class";
      if (activeFilter === "week") {
        const weekCutoff = getDatePlusDaysStr(7);
        return i.targetDate >= todayStr && i.targetDate <= weekCutoff;
      }
      return true;
    })
    .sort((a, b) => {
      // Pinned first
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      // Incomplete first
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      // Date ascending
      return a.targetDate.localeCompare(b.targetDate);
    });

  // Group items by date string
  const groupedByDate: Record<string, ActionItem[]> = {};
  filteredItems.forEach((item) => {
    const list = groupedByDate[item.targetDate] ?? [];
    list.push(item);
    groupedByDate[item.targetDate] = list;
  });

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <AppShell
      title={`Daily Action Hub 🎯`}
      subtitle={`Welcome, ${profile?.name?.split(" ")[0] || "Rahul"}! Here is what you need to do before each cutoff date.`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm text-xs font-bold"
          >
            <Plus className="size-4" /> Log In-Class Teacher Note
          </Button>
        </div>
      }
    >
      <OsStatusBar role="student" onToggleRole={() => switchRole("admin")} />

      {/* 1-DAY-BEFORE ADVANCE WARNING ALERT BANNER */}
      {dueTomorrowItems.length > 0 && (
        <div className="rounded-3xl border-2 border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-red-900/30 to-amber-950/40 p-5 sm:p-6 text-foreground shadow-lg backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-md animate-pulse">
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/20 px-2 py-0.5 text-[11px] font-extrabold text-rose-500 uppercase tracking-wider">
                  <span>🚨 1-Day Warning: Due Tomorrow!</span>
                </div>
                <h3 className="font-display font-bold text-base sm:text-lg mt-0.5">
                  You have {dueTomorrowItems.length} critical submission
                  {dueTomorrowItems.length > 1 ? "s" : ""} due tomorrow ({tomorrowStr})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dueTomorrowItems.map((i) => `${i.subject}: ${i.title}`).join(" • ")}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setActiveFilter("tomorrow")}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto"
            >
              View Tomorrow's Tasks ({dueTomorrowItems.length})
            </Button>
          </div>
        </div>
      )}

      {/* METRICS SUMMARY CARDS WITH OS FOCUS SPRINT TIMER */}
      <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <div
          onClick={() => setActiveFilter("today")}
          className={`surface-card p-4 sm:p-5 cursor-pointer transition-all hover:-translate-y-0.5 border-l-4 ${
            activeFilter === "today"
              ? "border-l-primary ring-2 ring-primary/20"
              : "border-l-primary/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Due Today (Aaj)</p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock3 className="size-4" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold">{dueTodayItems.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Immediate action</p>
        </div>

        <div
          onClick={() => setActiveFilter("tomorrow")}
          className={`surface-card p-4 sm:p-5 cursor-pointer transition-all hover:-translate-y-0.5 border-l-4 ${
            activeFilter === "tomorrow"
              ? "border-l-rose-500 ring-2 ring-rose-500/20"
              : "border-l-rose-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              Due Tomorrow (Kal)
            </p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-rose-600">
            {dueTomorrowItems.length}
          </p>
          <p className="text-[11px] text-rose-600/90 font-semibold mt-0.5">
            🚨 1-day advance warning
          </p>
        </div>

        <div
          onClick={() => setActiveFilter("in_class")}
          className={`surface-card p-4 sm:p-5 cursor-pointer transition-all hover:-translate-y-0.5 border-l-4 ${
            activeFilter === "in_class"
              ? "border-l-amber-500 ring-2 ring-amber-500/20"
              : "border-l-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              In-Class Teacher Notes
            </p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <MessageSquareQuote className="size-4" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold">
            {items.filter((i) => i.type === "in_class").length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Spoken in lecture</p>
        </div>

        <div className="surface-card p-4 sm:p-5 border-l-4 border-l-emerald-500/40">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Completed</p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-emerald-600">
            {items.filter((i) => i.completed).length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Done &amp; verified</p>
        </div>

        {/* OS FOCUS SPRINT COMPANION */}
        <div className="surface-card p-4 sm:p-5 border-l-4 border-l-indigo-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Timer className="size-4 text-indigo-500" /> Focus OS Sprint
            </p>
            <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-600 px-2 py-0.5 rounded-full">
              {pomodoroActive ? "Running" : "25m"}
            </span>
          </div>
          <div className="my-2 flex items-center justify-between">
            <p className="font-mono text-2xl font-black text-foreground">
              {formatTimer(pomodoroSeconds)}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={togglePomodoro}
                className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                title={pomodoroActive ? "Pause" : "Start"}
              >
                {pomodoroActive ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={resetPomodoro}
                className="size-8 rounded-xl border border-border bg-muted/60 text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors"
                title="Reset to 25:00"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Beat procrastination: finish 1 task during this sprint.
          </p>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Dates ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("today")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "today"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Today (Aaj)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("tomorrow")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "tomorrow"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-rose-600 hover:text-rose-700"
            }`}
          >
            Tomorrow (Kal 🚨)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("week")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "week"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("in_class")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "in_class"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-amber-600 hover:text-amber-700"
            }`}
          >
            In-Class Notes ("Ma'am ne bola")
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, teachers, subjects..."
            className="pl-9 h-9 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* TIMELINE LIST: GROUPED BY TARGET DATE */}
      <div className="mt-6 space-y-8">
        {sortedDates.length === 0 ? (
          <div className="surface-card p-10 text-center space-y-3">
            <CheckCircle2 className="size-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-base">No pending actions for this view!</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You're completely clear. Use "+ Log In-Class Teacher Note" whenever a professor
              mentions something in class.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setActiveFilter("all");
                setSearchQuery("");
              }}
              variant="outline"
              className="rounded-xl text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          sortedDates.map((dateStr) => {
            const isToday = dateStr === todayStr;
            const isTomorrow = dateStr === tomorrowStr;
            const dayItems = groupedByDate[dateStr] ?? [];

            const parsed = new Date(dateStr + "T00:00:00");
            const dayName = parsed.toLocaleDateString(undefined, { weekday: "long" });
            const formattedDate = parsed.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div key={dateStr} className="space-y-3">
                {/* DATE HEADER GROUP */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                      isTomorrow
                        ? "bg-rose-500 text-white shadow-md animate-pulse"
                        : isToday
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-foreground border border-border"
                    }`}
                  >
                    <Calendar className="size-3.5" />
                    <span>
                      {isTomorrow
                        ? "TOMORROW (KAL) 🚨 — 1-Day Cutoff!"
                        : isToday
                          ? "TODAY (AAJ) ⚡"
                          : `${dayName}, ${formattedDate}`}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {dayItems.length} action{dayItems.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* ITEMS UNDER THIS DATE */}
                <div className="grid gap-3">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      className={`glass animate-fadeInUp transition-all duration-200 rounded-2xl border space-y-4 ${
                        item.pinned
                          ? "border-primary/40 bg-primary/[0.015] ring-1 ring-primary/20 shadow-sm"
                          : item.urgency === "critical" && !item.completed
                            ? "border-rose-500/30"
                            : "border-border/70"
                      } ${item.completed ? "opacity-60 bg-muted/20" : ""}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        {/* Checkbox and Content */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleComplete(item.id)}
                            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                              item.completed
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-muted-foreground/50 hover:border-primary"
                            }`}
                          >
                            {item.completed && <Check className="size-3.5 stroke-[3]" />}
                          </button>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.pinned && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                                  <Pin className="size-3" /> PINNED
                                </span>
                              )}
                              {item.type === "in_class" ? (
                                <span className="text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <MessageSquareQuote className="size-3" /> Ma'am ne class me bola
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Megaphone className="size-3" /> Official Notice
                                </span>
                              )}
                              <span className="text-[10px] font-bold uppercase tracking-wide bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
                                {item.subject}
                              </span>
                              {item.urgency === "critical" && (
                                <span className="text-[10px] font-bold bg-rose-500/15 text-rose-600 px-2 py-0.5 rounded-md">
                                  🚨 Strict Cutoff
                                </span>
                              )}
                            </div>

                            {/* Main Task Title */}
                            <h4
                              className={`font-bold text-sm sm:text-base leading-snug text-foreground ${
                                item.completed ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {item.title}
                            </h4>

                            {/* Faculty name */}
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>👨‍🏫 Issued / Spoken by:</span>
                              <strong className="text-foreground/90">{item.profName}</strong>
                            </p>

                            {/* Personal sub-note */}
                            {editingNoteId === item.id ? (
                              <div className="pt-2 flex items-center gap-2">
                                <Input
                                  value={tempNoteText}
                                  onChange={(e) => setTempNoteText(e.target.value)}
                                  placeholder="e.g. Bring Rs 50 for xerox, take signatures..."
                                  className="h-8 rounded-xl text-xs"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => savePersonalSubNote(item.id)}
                                  className="h-8 rounded-xl text-xs font-bold"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingNoteId(null)}
                                  className="h-8 rounded-xl text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : item.personalNote ? (
                              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs text-foreground/90 flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5">
                                  <strong className="text-amber-600 font-semibold">
                                    📝 My Note:
                                  </strong>
                                  <span>{item.personalNote}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNoteId(item.id);
                                    setTempNoteText(item.personalNote || "");
                                  }}
                                  className="text-[10px] text-muted-foreground hover:text-foreground underline"
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNoteId(item.id);
                                  setTempNoteText("");
                                }}
                                className="text-[11px] text-primary/80 hover:text-primary font-medium hover:underline inline-block pt-0.5"
                              >
                                + Add my personal reminder note
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePinned(item.id)}
                            className={`size-8 p-0 rounded-xl ${
                              item.pinned ? "text-primary bg-primary/10" : "text-muted-foreground"
                            }`}
                            title={item.pinned ? "Unpin" : "Pin to Top"}
                          >
                            <Pin className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem(item.id)}
                            className="size-8 p-0 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD IN-CLASS TEACHER INSTRUCTION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <MessageSquareQuote className="size-5 text-amber-500" />
                  Log In-Class Teacher Instruction
                </h3>
                <p className="text-xs text-muted-foreground">
                  "Ma'am ne class me bola ki is date ke pehle submit karna hai."
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddModal(false)}
                className="size-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Teacher / Professor Name</Label>
                  <Input
                    required
                    value={newProf}
                    onChange={(e) => setNewProf(e.target.value)}
                    placeholder="e.g. Mrs. Abha Dhote"
                    className="rounded-xl text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Subject / Module</Label>
                  <Input
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. DBMS / Final Project"
                    className="rounded-xl text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">What did the teacher say to do?</Label>
                <Textarea
                  required
                  rows={3}
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="e.g. Bring 2 spiral-bound hard copies of Chapter 1 with index certified by guide..."
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold flex items-center gap-1 text-primary">
                    <Calendar className="size-3" /> Target Date ("Is din ke pehle"):
                  </Label>
                  <Input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="rounded-xl text-xs h-9 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Urgency Level</Label>
                  <select
                    value={newUrgency}
                    onChange={(e: any) => setNewUrgency(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 h-9 text-xs font-semibold"
                  >
                    <option value="critical">🚨 Critical / Compulsory</option>
                    <option value="important">⚠️ Important</option>
                    <option value="normal">ℹ️ Standard / Normal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  My Personal Note / Reminder (Optional)
                </Label>
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Get xerox from stationer before 9am"
                  className="rounded-xl text-xs h-9"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                >
                  Save to Daily Action Hub
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
