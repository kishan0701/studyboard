import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Megaphone,
  Search,
  Calendar,
  ShieldCheck,
  Sparkles,
  Plus,
  Pin,
  AlertTriangle,
  Share2,
  Check,
  Edit3,
  CalendarClock,
  Clock,
  Building2,
  FileText,
  BadgeAlert,
  Send,
  Download,
  Filter,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/notices")({
  head: () => ({
    meta: [
      { title: "Campus NoticeBoard — CampusSync OS" },
      {
        name: "description",
        content:
          "Official academic circulars, journal checking schedules, and compulsory attendance notices for Thakur Shyamnarayan Degree College.",
      },
    ],
  }),
  component: NoticesPage,
});

export interface OfficialNotice {
  id: string;
  title: string;
  category: "compulsory" | "journal" | "hallticket" | "project" | "holiday";
  actionDate: string; // YYYY-MM-DD
  authority: string;
  refNo: string;
  body: string;
  pinned: boolean;
  studentNote?: string;
  createdAt: string;
}

const DEFAULT_OFFICIAL_NOTICES: OfficialNotice[] = [
  {
    id: "not-0",
    title: "📢 COMPULSORY: TYCS – Mini Project Progress Presentation",
    category: "project",
    actionDate: "2026-10-10",
    authority: "Mrs. Abha Dhote (CS HOD) & Dr. G.D. Giri (Principal)",
    refNo: "TSDC/SP-06/375/2026-27",
    body: "All TYCS students are hereby informed that a Mini Project Progress Presentation has been scheduled on 10/10/2026 from 12:15 PM onwards in classroom number 701.\n\nAll project groups are required to present the current progress of their Mini Project and must come prepared with all relevant project data and supporting materials.\n\nStudents must present the following 13 points:\n1. Project Title\n2. Group Members' Names and Roll Numbers\n3. Problem Statement\n4. Objectives of the Project\n5. Proposed Solution / Methodology\n6. Technology Stack / Tools Used\n7. Dataset / Data Collection Details\n8. System Design / Architecture / Flowchart\n9. Work Completed So Far\n10. Screenshots / Working Prototype / Demonstration\n11. Current Results / Findings\n12. Work Remaining / Future Plan\n13. Any difficulties or challenges faced\n\nAll groups must ensure that their project-related data, documents, source code, dataset, presentation, and other required materials are ready for verification and discussion.\n\nAttendance and participation are compulsory for all students. Students are expected to be punctual and professionally prepared for the presentation.",
    pinned: true,
    studentNote: "Room 701 at 12:15 PM sharp. Keep slides, prototype, dataset & source code ready.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "not-1",
    title: "🚨 URGENT: OS Lab 4 Practical Journal Checking & Certification",
    category: "journal",
    actionDate: "2026-09-12",
    authority: "Mrs. Abha Dhote (CS HOD)",
    refNo: "TSDC/CS/LAB-4/2026-27",
    body: "All TYCS Section B students must submit their certified Operating Systems practical journals for Lab 4 (Round Robin & Priority CPU Scheduling) in Lab 3 (Room 701) by tomorrow 2:00 PM without fail.\n\n• Certified Index & lab assistant signature is compulsory.\n• Students failing to present certified journals will receive ZERO in internal evaluation.\n• Practical viva will be conducted simultaneously.",
    pinned: true,
    studentNote: "Get index verified by Lab Assistant before 11:30 AM",
    createdAt: new Date().toISOString(),
  },
  {
    id: "not-2",
    title: "⚠️ Compulsory Attendance: Industry Seminar on Cyber Forensics",
    category: "compulsory",
    actionDate: "2026-09-11",
    authority: "Dr. G.D. Giri (Principal)",
    refNo: "TSDC/ACAD/SEMINAR/2026/109",
    body: "A mandatory technical keynote on 'Enterprise Threat Modeling & Cyber Forensics' will be held today in the Central Auditorium (Room 701) from 11:00 AM to 1:30 PM.\n\n• Biometric entry is compulsory at 10:45 AM.\n• Attendance will directly impact the 75% term-grant eligibility.\n• Formal dress code and college ID card required.",
    pinned: true,
    studentNote: "Carry college ID card for biometric punch",
    createdAt: new Date().toISOString(),
  },
  {
    id: "not-3",
    title: "🎟️ Attendance Defaulter List & Hall Ticket Clearance Undertaking",
    category: "hallticket",
    actionDate: "2026-09-14",
    authority: "Exam Cell & HOD CS",
    refNo: "TSDC/EXAM/DEF-TYCS/2026",
    body: "Students with attendance below 75% are directed to meet HOD Mrs. Abha Dhote in Room 304 accompanied by their parent/guardian with a written undertaking letter before 14th Sep 2026.\n\n• Hall tickets for semester evaluations will be withheld for uncleared defaulters.\n• Library and laboratory dues clearance receipts must be produced.",
    pinned: false,
    studentNote: "Check attendance percentage on college ERP portal",
    createdAt: new Date().toISOString(),
  },
  {
    id: "not-4",
    title: "📌 Final Year Project (Black Book) Chapters 1 to 3 Draft Submission",
    category: "project",
    actionDate: "2026-09-15",
    authority: "Project Committee / Mrs. Abha Dhote",
    refNo: "TSDC/TYCS/PROJ-01/2026",
    body: "All project groups must submit 2 spiral-bound hard copies of Chapters 1, 2, and 3 along with a certified Turnitin plagiarism report (< 10%).\n\n• Project guide signatures on preliminary pages are compulsory.\n• Soft copy must also be emailed to cs.projects@tsdc.edu.in by 5:00 PM.",
    pinned: false,
    studentNote: "Get spiral binding from stationer shop near gate",
    createdAt: new Date().toISOString(),
  },
  {
    id: "not-5",
    title: "🏛️ Academic Timetable Reschedule: Saturday Laboratory Sessions",
    category: "holiday",
    actionDate: "2026-09-16",
    authority: "Prof. S. Sharma (Time Table In-charge)",
    refNo: "TSDC/TT/TYCS-REV/2026",
    body: "Due to technical symposium preparations, Friday's Computer Networks practical batch B is rescheduled to Saturday morning at 10:30 AM in Computer Lab 2.",
    pinned: false,
    studentNote: "",
    createdAt: new Date().toISOString(),
  },
];

const LOCAL_NOTICES_KEY = "studyboard_smart_notices_v2";

function NoticesPage() {
  const { user, profile, role } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [notices, setNotices] = useState<OfficialNotice[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_NOTICES_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_OFFICIAL_NOTICES;
    } catch {
      return DEFAULT_OFFICIAL_NOTICES;
    }
  });

  // New Notice Modal State
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState<OfficialNotice["category"]>("journal");
  const [newDate, setNewDate] = useState("2026-09-12");
  const [newBody, setNewBody] = useState("");
  const [newRef, setNewRef] = useState("TSDC/CS/NOTICE/2026-27");
  const [newAuthor, setNewAuthor] = useState(profile?.name || "Mrs. Abha Dhote (CS HOD)");

  const saveNotices = (updated: OfficialNotice[]) => {
    setNotices(updated);
    localStorage.setItem(LOCAL_NOTICES_KEY, JSON.stringify(updated));
  };

  const togglePin = (id: string) => {
    const updated = notices.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
    saveNotices(updated);
    toast.success("Notice pin status updated!");
  };

  const editStudentNote = (id: string) => {
    const item = notices.find((n) => n.id === id);
    const note = prompt(
      "Apna personal reminder note likhein (e.g. Bring Rs 50 for xerox):",
      item?.studentNote || "",
    );
    if (note !== null) {
      const updated = notices.map((n) => (n.id === id ? { ...n, studentNote: note.trim() } : n));
      saveNotices(updated);
      toast.success("Personal reminder note attached to notice!");
    }
  };

  const shareToWhatsApp = (n: OfficialNotice) => {
    const whatsappText =
      `📢 *THAKUR SHYAMNARAYAN DEGREE COLLEGE (TSDC)*\n` +
      `*DEPARTMENT OF COMPUTER SCIENCE*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *${n.title.toUpperCase()}*\n` +
      `📄 *Ref No:* ${n.refNo}\n\n` +
      `🗓️ *MANDATORY ACTION DATE:* ${n.actionDate} (${n.actionDate === "2026-09-12" ? "TOMORROW (KAL 🚨)" : "STRICT DEADLINE"})\n` +
      `👨‍🏫 *Issued By:* ${n.authority}\n\n` +
      `🎯 *Official Circular Details:*\n${n.body}\n\n` +
      `🌐 *Check on CampusSync OS:* http://localhost:8080/notices\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    navigator.clipboard.writeText(whatsappText);
    toast.success("Formatted notice copied! Ready to paste into Class WhatsApp group.");
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error("Please fill in the title and notice details!");
      return;
    }

    const created: OfficialNotice = {
      id: "not-" + Date.now(),
      title: newTitle.trim(),
      category: newCat,
      actionDate: newDate,
      authority: newAuthor,
      refNo: newRef.trim(),
      body: newBody.trim(),
      pinned: true,
      studentNote: "",
      createdAt: new Date().toISOString(),
    };

    const updated = [created, ...notices];
    saveNotices(updated);
    setShowModal(false);
    setNewTitle("");
    setNewBody("");
    toast.success("Official circular broadcasted and pinned to student noticeboards!");
  };

  const filtered = notices
    .filter((n) => {
      const matchCat = categoryFilter === "all" || n.category === categoryFilter;
      const matchSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.body.toLowerCase().includes(search.toLowerCase()) ||
        n.authority.toLowerCase().includes(search.toLowerCase()) ||
        n.refNo.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.actionDate.localeCompare(b.actionDate);
    });

  return (
    <AppShell
      title="Campus NoticeBoard 📢"
      subtitle="Thakur Shyamnarayan Degree College · Central Examination & Academic Circular Command Center."
      actions={
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm text-xs font-bold"
            >
              <Plus className="size-4" /> Broadcast Official Circular
            </Button>
          )}
        </div>
      }
    >
      {/* COLLEGE INSTITUTIONAL BANNER */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-md">
              <Building2 className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  TSDC Autonomous
                </span>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  Affiliated to University of Mumbai · NAAC Accredited 'A' Grade
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                Thakur Shyamnarayan Degree College Notice Board
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Department of Computer Science &amp; Information Technology · TYCS Semester 5
                (Autumn 2026). All notices are digitally verified and auto-synced with daily action
                planners.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex sm:flex-col gap-2 self-start sm:self-auto text-right">
            <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                Active Session
              </span>
              <strong className="text-xs font-bold text-foreground">TYCS Sec B</strong>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
              <span className="text-[10px] font-bold text-emerald-600 uppercase block">
                Verified Notices
              </span>
              <strong className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {notices.length} Published
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 1-DAY WARNING HIGHLIGHT BANNER */}
      <div className="mt-6 rounded-2xl border-2 border-rose-500/40 bg-gradient-to-r from-rose-500/15 via-red-500/10 to-transparent p-4 sm:p-5 shadow-xs">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white font-bold animate-pulse">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-extrabold text-rose-600 uppercase">
                <span>🚨 Cutoff Alert: Tomorrow (12 Sep)</span>
              </div>
              <h4 className="font-bold text-sm sm:text-base text-foreground mt-0.5">
                OS Lab 4 Practical Journal Certification due tomorrow by 2:00 PM in Lab 3!
              </h4>
              <p className="text-xs text-muted-foreground">
                Certified Index is mandatory. Absent students will receive zero in practical
                internals.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setCategoryFilter("journal")}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 self-start sm:self-auto"
          >
            View Journal Notice
          </Button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/60">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Circulars ({notices.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("journal")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === "journal"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-rose-600 hover:text-rose-700"
            }`}
          >
            🔬 Practical Journals
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("compulsory")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === "compulsory"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-amber-600 hover:text-amber-700"
            }`}
          >
            ⚠️ Compulsory Attendance
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("hallticket")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === "hallticket"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-indigo-600 hover:text-indigo-700"
            }`}
          >
            🎟️ Defaulter / Hall Ticket
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("project")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === "project"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-600 hover:text-emerald-700"
            }`}
          >
            📌 Black Book Project
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars, HOD, ref..."
            className="pl-9 h-9 rounded-xl text-xs bg-card"
          />
        </div>
      </div>

      {/* NOTICES LIST */}
      <div className="mt-6 space-y-4">
        {filtered.map((n) => {
          const isTomorrow = n.actionDate === "2026-09-12";
          const isToday = n.actionDate === "2026-09-11";

          return (
            <article
              key={n.id}
              className={`glass animate-fadeInUp p-5 sm:p-6 transition-all duration-200 rounded-2xl border space-y-4 ${
                n.pinned
                  ? "border-primary/40 bg-primary/[0.015] ring-1 ring-primary/20 shadow-sm"
                  : "border-border/80"
              }`}
            >
              {/* Header: Badge + Ref No + Action Date */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/60 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.pinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                        <Pin className="size-3" /> PINNED TO TOP
                      </span>
                    )}
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase border ${
                        n.category === "journal"
                          ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                          : n.category === "compulsory"
                            ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                            : n.category === "hallticket"
                              ? "bg-indigo-500/15 text-indigo-600 border-indigo-500/30"
                              : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                      }`}
                    >
                      {n.category === "journal"
                        ? "🔬 Practical Journal Checking"
                        : n.category === "compulsory"
                          ? "⚠️ Compulsory Attendance"
                          : n.category === "hallticket"
                            ? "🎟️ Hall Ticket / Defaulter"
                            : "📌 Project Documentation"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                      {n.refNo}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                    {n.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <Button
                    size="sm"
                    variant={n.pinned ? "default" : "outline"}
                    className="h-8 rounded-xl text-xs gap-1.5"
                    onClick={() => togglePin(n.id)}
                  >
                    <Pin className="size-3.5" />
                    <span>{n.pinned ? "Pinned" : "Pin"}</span>
                  </Button>
                </div>
              </div>

              {/* Mandatory Action Date Callout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-muted/40 p-3 text-xs border border-border/60">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <CalendarClock className="size-4 text-primary shrink-0" />
                  <span>
                    Mandatory Cutoff Date: <u className="underline-offset-4">{n.actionDate}</u>
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    isTomorrow
                      ? "bg-rose-500 text-white animate-pulse"
                      : isToday
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-background text-foreground border border-border"
                  }`}
                >
                  {isTomorrow
                    ? "🚨 TOMORROW (KAL) CUTOFF!"
                    : isToday
                      ? "⚡ TODAY (AAJ)"
                      : "UPCOMING SCHEDULE"}
                </span>
              </div>

              {/* Notice Body */}
              <div className="text-xs sm:text-sm leading-relaxed text-muted-foreground font-normal whitespace-pre-line">
                {n.body}
              </div>

              {/* Footer: Authority & Personal Sub-Note */}
              <div className="border-t border-border/60 pt-3 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <span className="text-muted-foreground">
                    Authority / Signatory:{" "}
                    <strong className="text-foreground font-semibold">{n.authority}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => editStudentNote(n.id)}
                    className="text-primary font-bold hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
                  >
                    <Edit3 className="size-3" />{" "}
                    {n.studentNote ? "Edit My Personal Note" : "+ Add Personal Action Note"}
                  </button>
                </div>

                {n.studentNote && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary font-medium flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <strong className="font-bold">📝 My Personal Action Note:</strong>
                      <span>{n.studentNote}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => editStudentNote(n.id)}
                      className="text-[10px] underline hover:text-primary-foreground shrink-0"
                    >
                      Change
                    </button>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs rounded-xl text-emerald-600 border-emerald-600/30 hover:bg-emerald-500/10 gap-1.5 font-bold"
                    onClick={() => shareToWhatsApp(n)}
                  >
                    <Share2 className="size-3.5" /> 1-Click WhatsApp Share for Class Group
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* MODAL: BROADCAST OFFICIAL CIRCULAR (FOR FACULTY/HOD) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Megaphone className="size-5 text-emerald-600" />
                  Broadcast Official Notice
                </h3>
                <p className="text-xs text-muted-foreground">
                  Post official circular to students' CampusSync noticeboard &amp; date timelines.
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowModal(false)}
                className="size-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Notice Title / Headline</Label>
                <Input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. OS Lab 4 Practical Journal Checking & Viva"
                  className="rounded-xl text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Category</Label>
                  <select
                    value={newCat}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setNewCat(e.target.value as OfficialNotice["category"])
                    }
                    className="w-full rounded-xl border border-input bg-background px-3 h-9 text-xs font-semibold"
                  >
                    <option value="journal">🔬 Practical Journal Checking</option>
                    <option value="compulsory">⚠️ Compulsory Attendance</option>
                    <option value="hallticket">🎟️ Hall Ticket / Defaulter</option>
                    <option value="project">📌 Black Book Project</option>
                    <option value="holiday">🏛️ Reschedule / Holiday</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Mandatory Action Date</Label>
                  <Input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="rounded-xl text-xs h-9 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Official Ref No.</Label>
                  <Input
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    placeholder="e.g. TSDC/CS/2026/04"
                    className="rounded-xl text-xs h-9 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Issued By / Signatory</Label>
                  <Input
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="e.g. Mrs. Abha Dhote (CS HOD)"
                    className="rounded-xl text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Notice Body / Circular Details</Label>
                <Textarea
                  required
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Detailed instructions, venues, zero marks warning..."
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Publish to NoticeBoard
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
