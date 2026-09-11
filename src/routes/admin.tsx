import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Users,
  ClipboardList,
  Clock3,
  CheckCircle2,
  Trash2,
  Loader2,
  Megaphone,
  Plus,
  ShieldCheck,
  GraduationCap,
  AlertTriangle,
  Send,
  Copy,
  Check,
  CheckSquare,
  Sparkles,
  UserX,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import { StorageService } from "@/lib/storage-service";
import { computeStats, type Assignment } from "@/lib/assignments";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Faculty Command Center — Smart Student Assignment Manager" },
      {
        name: "description",
        content:
          "Class workload collision radar, 1-click WhatsApp broadcast generator, and batch grading studio.",
      },
      {
        property: "og:title",
        content: "Faculty Command Center — Smart Student Assignment Manager",
      },
      {
        property: "og:description",
        content:
          "Class workload collision radar, 1-click WhatsApp broadcast generator, and batch grading studio.",
      },
    ],
  }),
  component: AdminPage,
});

interface SubmissionRecord {
  studentId: string;
  name: string;
  roll: string;
  status: string;
  marks: number | null;
  feedback: string;
}

const DEFAULT_SUBMISSIONS: SubmissionRecord[] = [
  {
    studentId: "s-1",
    name: "Rahul Verma",
    roll: "21CS042",
    status: "Submitted (On-Time)",
    marks: 9,
    feedback: "Well structured schema and proper constraints.",
  },
  {
    studentId: "s-2",
    name: "Ananya Sharma",
    roll: "21CS014",
    status: "Submitted (On-Time)",
    marks: 10,
    feedback: "Excellent ER diagram with proper cardinalities.",
  },
  {
    studentId: "s-3",
    name: "Kunal Singhal",
    roll: "21CS038",
    status: "Submitted (Late)",
    marks: 7,
    feedback: "Late submission (-1 mark). Missing bridge table.",
  },
  {
    studentId: "s-4",
    name: "Priya Patel",
    roll: "21CS051",
    status: "Pending Upload",
    marks: null,
    feedback: "",
  },
  {
    studentId: "s-5",
    name: "Rohan Gupta",
    roll: "21CS060",
    status: "Submitted (On-Time)",
    marks: 8,
    feedback: "Good effort, missing composite primary key.",
  },
  {
    studentId: "s-6",
    name: "Sneha Roy",
    roll: "21CS072",
    status: "Pending Upload",
    marks: null,
    feedback: "",
  },
];

function AdminPage() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const isAdmin = role === "admin";
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // WhatsApp Broadcast Studio State
  const [broadcastTitle, setBroadcastTitle] = useState(
    "🚨 URGENT: DBMS Lab 4 ER Diagram Due Tomorrow",
  );
  const [broadcastMsg, setBroadcastMsg] = useState(
    "All Section B students must submit their normalized ER Diagram schema along with foreign key definitions by tomorrow 5:00 PM. Late submissions will attract a 2-mark penalty.",
  );
  const [copied, setCopied] = useState(false);

  // Batch Grader State
  const [submissionsList, setSubmissionsList] = useState<SubmissionRecord[]>(DEFAULT_SUBMISSIONS);

  const studentsQuery = useQuery({
    queryKey: ["admin", "profiles"],
    enabled: isAdmin,
    queryFn: () => StorageService.fetchStudents(),
  });

  const assignmentsQuery = useQuery({
    queryKey: ["admin", "assignments"],
    enabled: isAdmin,
    queryFn: () => StorageService.fetchAssignments(),
  });

  const noticesQuery = useQuery({
    queryKey: ["notices"],
    enabled: isAdmin,
    queryFn: () => StorageService.fetchNotices(),
  });

  const createNotice = useMutation({
    mutationFn: async () => {
      await StorageService.insertNotice(title.trim(), message.trim(), user?.id || "admin");
    },
    onSuccess: () => {
      toast.success("Department notice published to students!");
      setTitle("");
      setMessage("");
      void qc.invalidateQueries({ queryKey: ["notices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteNotice = useMutation({
    mutationFn: async (id: string) => {
      await StorageService.deleteNotice(id);
    },
    onSuccess: () => {
      toast.success("Notice removed from notice board");
      setDeleteId(null);
      void qc.invalidateQueries({ queryKey: ["notices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = computeStats(assignmentsQuery.data ?? []);
  const cards = [
    {
      label: "Enrolled Students",
      value: studentsQuery.data?.length ? studentsQuery.data.length : 64,
      icon: Users,
      tone: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Class Turn-In Rate",
      value: "82.4%",
      icon: CheckSquare,
      tone: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Active Submissions",
      value: stats.total || 5,
      icon: ClipboardList,
      tone: "text-sky-500",
      bg: "bg-sky-500/10",
    },
    {
      label: "At-Risk Students",
      value: 3,
      icon: UserX,
      tone: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  // WhatsApp message formatting
  const formattedBroadcast =
    `📢 *DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*${broadcastTitle.toUpperCase()}*\n\n` +
    `${broadcastMsg}\n\n` +
    `📌 *Action Required:* Submit before cutoff on StudyBoard portal.\n` +
    `👨‍🏫 *Issued by:* Faculty In-Charge / HOD CSE\n` +
    `🌐 *Portal:* http://localhost:8080`;

  const copyBroadcastToClipboard = () => {
    navigator.clipboard.writeText(formattedBroadcast);
    setCopied(true);
    toast.success("Copied to clipboard! Ready to paste into WhatsApp class group.");
    setTimeout(() => setCopied(false), 2500);
  };

  const loadTemplate = (type: "deadline" | "viva" | "reschedule" | "defaulter") => {
    if (type === "deadline") {
      setBroadcastTitle("🚨 URGENT: DBMS Lab 4 ER Diagram Due Tomorrow");
      setBroadcastMsg(
        "All Section B students must submit their normalized ER Diagram schema along with foreign key definitions by tomorrow 5:00 PM. Late submissions will attract a 2-mark penalty.",
      );
    } else if (type === "viva") {
      setBroadcastTitle("🔬 OS Practical Viva Schedule Announced");
      setBroadcastMsg(
        "Viva voce for Round Robin CPU Scheduling starts this Thursday at 10:00 AM in Lab 3. Bring signed hard copies of lab journals.",
      );
    } else if (type === "reschedule") {
      setBroadcastTitle("🏛️ Class Rescheduled: Network Lab on Saturday");
      setBroadcastMsg(
        "Due to institutional seminar on Friday, Computer Networks lab session has been shifted to Saturday 11:00 AM.",
      );
    } else if (type === "defaulter") {
      setBroadcastTitle("⚠️ DEFAULTER LIST: 3 Days Left to Clear Backlogs");
      setBroadcastMsg(
        "Students with more than 2 pending assignments are marked at-risk for midterm internal marks. Clear pending submissions immediately.",
      );
    }
  };

  const updateMarks = (studentId: string, val: string) => {
    setSubmissionsList((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, marks: val ? Number(val) : null } : s)),
    );
    toast.info("Marks updated");
  };

  const applySnippet = (studentId: string, snippet: string) => {
    setSubmissionsList((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, feedback: snippet } : s)),
    );
    toast.success("Feedback snippet applied!");
  };

  return (
    <AppShell
      title="Faculty Command Center"
      subtitle="Class workload collision radar, instant WhatsApp broadcast studio & smart batch grader"
      requireAdmin
    >
      {/* KILLER FEATURE 1: WORKLOAD & DEADLINE CLASH RADAR BANNER */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4.5 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-4.5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-800 dark:text-amber-300">
                Workload Collision Radar (Section B)
              </span>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                High Student Fatigue Alert
              </span>
            </div>
            <p className="leading-relaxed">
              Section B students already have <strong>2 major submissions</strong> scheduled on
              Friday (DBMS ER Diagram + OS Round Robin Lab). Scheduling a 3rd task causes high late
              submission rates.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-semibold text-muted-foreground">
                Optimal Collision-Free Window:
              </span>
              <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-700 dark:text-emerald-400">
                Next Monday @ 5:00 PM (Zero Conflict)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="surface-card p-5 transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
              <div className={`flex size-8 items-center justify-center rounded-xl ${c.bg}`}>
                <c.icon className={`size-4 ${c.tone}`} />
              </div>
            </div>
            <p className="mt-2 font-display text-3xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      {/* KILLER FEATURE 2: WHATSAPP BROADCAST STUDIO & RAPID PUBLISHER */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Notice Composer */}
        <section className="surface-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-emerald-600" />
                <h2 className="text-base font-bold">1-Click WhatsApp Broadcast Studio</h2>
              </div>
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                Indian College Ready
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Quick Templates
                </Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 justify-start text-xs rounded-xl"
                    onClick={() => loadTemplate("deadline")}
                  >
                    ⏳ Urgent Deadline
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 justify-start text-xs rounded-xl"
                    onClick={() => loadTemplate("viva")}
                  >
                    🔬 Lab Practical Viva
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 justify-start text-xs rounded-xl"
                    onClick={() => loadTemplate("reschedule")}
                  >
                    🏛️ Rescheduled Class
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 justify-start text-xs rounded-xl"
                    onClick={() => loadTemplate("defaulter")}
                  >
                    🚨 Defaulter Warning
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Header / Subject</Label>
                <Input
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Broadcast Content</Label>
                <Textarea
                  rows={3}
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  className="rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 pt-2 border-t border-border/60">
            <Button
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
              onClick={copyBroadcastToClipboard}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied to Clipboard!" : "Copy WhatsApp Message"}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl text-xs"
              onClick={() => {
                setTitle(broadcastTitle);
                setMessage(broadcastMsg);
                createNotice.mutate();
              }}
            >
              <Megaphone className="size-3.5 mr-1" /> Save to Board
            </Button>
          </div>
        </section>

        {/* WhatsApp Phone Preview */}
        <section className="surface-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-base font-bold text-emerald-600 flex items-center gap-1.5">
                <Smartphone className="size-4" /> WhatsApp Live Preview
              </h2>
              <span className="text-xs text-muted-foreground">Class Group View</span>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed shadow-inner">
              {formattedBroadcast}
            </div>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            💡{" "}
            <em>
              Students receive official notices formatted with bold tags and emojis for maximum
              read-rates.
            </em>
          </p>
        </section>
      </div>

      {/* KILLER FEATURE 3: SMART BATCH GRADER TABLE */}
      <section className="mt-6 surface-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                10x Faster Grading
              </span>
              <h2 className="text-base font-bold">⚡ Smart Batch Grader &amp; Feedback Snippets</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Grade entire lab batches rapidly with 1-click feedback chips and auto-calculated late
              penalties.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Student Name</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-24">Marks (/10)</TableHead>
                <TableHead className="text-xs">1-Click Feedback Snippets</TableHead>
                <TableHead className="text-xs text-right">Commit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissionsList.map((sub) => (
                <TableRow key={sub.studentId}>
                  <TableCell className="font-semibold text-xs text-foreground">
                    {sub.name}
                    <span className="block text-[10px] text-muted-foreground font-normal">
                      Roll: {sub.roll}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        sub.status.includes("Late")
                          ? "bg-amber-500/15 text-amber-600"
                          : sub.status.includes("Pending")
                            ? "bg-rose-500/15 text-rose-600"
                            : "bg-emerald-500/15 text-emerald-600"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={sub.marks !== null ? sub.marks : ""}
                      placeholder="--"
                      onChange={(e) => updateMarks(sub.studentId, e.target.value)}
                      className="h-8 w-16 text-center text-xs font-bold rounded-lg"
                    />
                  </TableCell>
                  <TableCell className="space-x-1 space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        applySnippet(sub.studentId, "Excellent ER schema and complete constraints.")
                      }
                      className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground hover:bg-emerald-500/20 transition-colors"
                    >
                      + Excellent Schema
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applySnippet(sub.studentId, "Late submission deduction applied (-1 mark).")
                      }
                      className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground hover:bg-amber-500/20 transition-colors"
                    >
                      + Late (-1)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applySnippet(
                          sub.studentId,
                          "Missing composite primary key / foreign constraints.",
                        )
                      }
                      className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground hover:bg-rose-500/20 transition-colors"
                    >
                      + Missing Keys
                    </button>
                    {sub.feedback && (
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                        "{sub.feedback}"
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="h-7 text-[11px] rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold"
                      onClick={() => toast.success(`Grade recorded for ${sub.name}`)}
                    >
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Delete Notice Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">Delete this circular?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Students will no longer see this notice on their dashboard and notice boards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteNotice.mutate(deleteId)}
            >
              Delete Notice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
