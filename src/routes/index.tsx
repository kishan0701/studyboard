import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarClock,
  ClipboardList,
  Megaphone,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Database,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyBoard — Smart Student Assignment & Deadline Manager" },
      {
        name: "description",
        content:
          "Full-stack academic productivity platform for college students with automated deadline risk classification, department notices, and an advanced AI Study Copilot.",
      },
      { property: "og:title", content: "StudyBoard — Smart Student Assignment & Deadline Manager" },
      {
        property: "og:description",
        content:
          "Centralise assignments, track submission deadlines with color-coded risk levels, and access department circulars.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: ClipboardList,
    title: "Assignment CRUD & Tracking",
    text: "Add, edit, delete, search and mark coursework completed with subject, title, priority and submission dates.",
  },
  {
    icon: CalendarClock,
    title: "Automated Deadline Risk Engine",
    text: "Local timezone difference calculations categorize every pending assignment as Overdue, High, Medium, or Low risk.",
  },
  {
    icon: Megaphone,
    title: "Department Notice Board",
    text: "Admins publish real-time verified circulars and exams updates visible instantly to all enrolled students.",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access Control",
    text: "PostgreSQL Row-Level Security ensures students only access their personal tasks while admins oversee the roster.",
  },
  {
    icon: Bot,
    title: "OS-Like AI Study Copilot",
    text: "Voice-enabled intelligent assistant that adds assignments via chat, generates daily study plans, and breaks down hard subjects.",
  },
  {
    icon: Database,
    title: "Persistent Hybrid Storage",
    text: "Seamlessly operates with Supabase PostgreSQL cloud backend and resilient offline local storage.",
  },
];

const riskLevels = [
  {
    label: "DONE",
    color: "bg-success/15 text-success border-success/30",
    condition: "Status is Marked Completed",
  },
  {
    label: "OVERDUE",
    color: "bg-destructive/15 text-destructive border-destructive/30",
    condition: "Pending & Deadline < Today",
  },
  {
    label: "HIGH RISK",
    color: "bg-destructive/15 text-destructive border-destructive/30",
    condition: "Pending & Due within 1 Day",
  },
  {
    label: "MEDIUM RISK",
    color: "bg-warning/20 text-warning-foreground border-warning/40",
    condition: "Pending & Due within 3 Days",
  },
  {
    label: "LOW RISK",
    color: "bg-info/15 text-info border-info/30",
    condition: "Pending & Due in > 3 Days",
  },
];

function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 lg:px-8 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-base font-bold leading-tight">
            StudyBoard
            <span className="block text-[11px] font-medium text-muted-foreground">
              Smart Assignment Manager
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link to={user ? "/dashboard" : "/auth"}>{user ? "Open Dashboard" : "Sign In"}</Link>
          </Button>
          {!user && (
            <Button asChild size="sm" className="rounded-xl hidden sm:inline-flex">
              <Link to="/auth">Get Started</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 lg:px-8 lg:pt-16 flex-1">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5 text-amber-500" />
              Academic Productivity Platform &amp; AI Copilot
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] sm:text-5xl tracking-tight">
              Master Your Deadlines. <br />
              <span className="text-primary bg-clip-text">Never Miss an Assignment.</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              College coursework gets scattered across WhatsApp groups, notebooks, and LMS portals.
              StudyBoard unifies every assignment, automatically calculates deadline risks, and
              integrates an AI Study Copilot right on your dashboard.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Button asChild size="lg" className="rounded-xl font-semibold shadow-md gap-2">
                <Link to={user ? "/dashboard" : "/auth"}>
                  {user ? "Go to Dashboard" : "Launch Workspace"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl font-semibold">
                <Link to="/notices">Department Notices</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted-foreground border-t border-border/60 pt-4">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="size-4 text-success" /> React 19 + TanStack
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="size-4 text-success" /> PostgreSQL &amp; RLS
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="size-4 text-success" /> Automated Risk Engine
              </span>
            </div>
          </div>

          {/* Interactive Live Preview Card */}
          <div className="hero-gradient relative overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/80">
                  Student Live Dashboard
                </p>
              </div>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold">
                v2.0 Active
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Total Coursework", "12"],
                ["Pending Tasks", "5"],
                ["Completed", "7"],
                ["Due This Week", "3"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl bg-black/20 p-3.5 backdrop-blur-md border border-white/10"
                >
                  <p className="text-[11px] text-primary-foreground/70">{label}</p>
                  <p className="mt-1 font-display text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                {
                  title: "DBMS — ER Diagram Submission",
                  when: "Due Tomorrow",
                  risk: "HIGH",
                  color: "bg-rose-500/30 text-rose-200 border-rose-400/40",
                },
                {
                  title: "Operating Systems — CPU Scheduling",
                  when: "In 3 Days",
                  risk: "MEDIUM",
                  color: "bg-amber-500/30 text-amber-200 border-amber-400/40",
                },
                {
                  title: "Applied Mathematics — Linear Algebra",
                  when: "In 8 Days",
                  risk: "LOW",
                  color: "bg-sky-500/30 text-sky-200 border-sky-400/40",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3.5 py-2.5 text-xs backdrop-blur border border-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.title}</p>
                    <p className="text-[10px] text-primary-foreground/70">{item.when}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${item.color}`}
                  >
                    {item.risk} RISK
                  </span>
                </div>
              ))}
            </div>

            {/* AI Assistant Floating Pill Demo */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-xs backdrop-blur border border-white/10">
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-amber-300" />
                <span className="text-[11px]">
                  AI Copilot: "Study plan generated for 3 subjects"
                </span>
              </div>
              <span className="text-[10px] font-bold underline">Try Copilot</span>
            </div>
          </div>
        </div>
      </section>

      {/* Deadline Risk Engine Explanation Section */}
      <section className="border-t border-border/60 bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Automatic Deadline Risk Engine
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every assignment calculates whole-day timezone differences against submission dates,
              giving visual signals before deadlines become emergencies.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {riskLevels.map((r) => (
              <div
                key={r.label}
                className="surface-card p-4 text-center flex flex-col items-center justify-between"
              >
                <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${r.color}`}>
                  {r.label}
                </span>
                <p className="mt-3 text-xs text-muted-foreground font-medium">{r.condition}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Everything Needed for College Success
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Architected specifically for student productivity and department coordination.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="surface-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 bg-muted/20 px-5 py-8 text-center text-xs text-muted-foreground lg:px-8">
        <p className="font-semibold text-foreground">
          StudyBoard — Smart Student Assignment &amp; Deadline Manager
        </p>
        <p className="mt-1 text-[11px]">
          Full-Stack College Mini-Project • React 19 • TanStack Start • PostgreSQL
        </p>
      </footer>
    </div>
  );
}
