import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Megaphone,
  ShieldCheck,
  LogOut,
  GraduationCap,
  Menu,
  X,
  Sparkles,
  ArrowLeftRight,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AICopilot } from "@/components/AICopilot";
import { StorageService } from "@/lib/storage-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Assignment } from "@/lib/assignments";

// Dynamic navigation links generated per role inside AppShell

export function AppShell({
  title,
  subtitle,
  actions,
  children,
  requireAdmin = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, profile, role, loading, signOut, switchRole } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const qc = useQueryClient();

  const isFaculty = role === "admin";
  const navLinks = isFaculty
    ? [
        { to: "/dashboard", label: "AI Notice Broadcaster", icon: Megaphone },
        { to: "/notices", label: "Campus NoticeBoard", icon: LayoutDashboard },
        { to: "/admin", label: "Academic Control Center", icon: ShieldCheck },
      ]
    : [
        { to: "/dashboard", label: "Daily Action Hub (Aaj/Kal)", icon: LayoutDashboard },
        { to: "/notices", label: "Campus NoticeBoard", icon: Megaphone },
        { to: "/assignments", label: "Assignments & Projects", icon: ClipboardList },
      ];

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Dark mode toggle
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Queries for AI Copilot context
  const assignmentsQuery = useQuery({
    queryKey: ["assignments", user?.id],
    enabled: !!user,
    queryFn: () => StorageService.fetchAssignments(user?.id),
  });

  const noticesQuery = useQuery({
    queryKey: ["notices"],
    enabled: !!user,
    queryFn: () => StorageService.fetchNotices(),
  });

  const handleAiAddAssignment = async (newAsg: Partial<Assignment>) => {
    if (!user) return;
    await StorageService.insertAssignment({
      ...newAsg,
      user_id: user.id,
    });
    void qc.invalidateQueries({ queryKey: ["assignments"] });
    toast.success("Assignment created via AI Copilot!");
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg animate-pulse">
          <GraduationCap className="size-6" />
        </div>
        <p className="font-medium text-foreground">Loading StudyBoard workspace…</p>
      </div>
    );
  }

  const blocked = requireAdmin && role !== "admin";

  const toggleRoleDemo = () => {
    const targetRole = role === "admin" ? "student" : "admin";
    switchRole(targetRole);
    toast.info(`Switched view to ${targetRole === "admin" ? "Administrator" : "Student"}`);
    if (targetRole === "admin" && pathname === "/dashboard") {
      void navigate({ to: "/admin" });
    } else if (targetRole === "student" && pathname === "/admin") {
      void navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen lg:flex bg-background text-foreground transition-colors duration-200">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground transition-transform lg:static lg:translate-x-0 shadow-xl lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-2">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-xl text-white shadow-sm transition-colors",
              isFaculty ? "bg-emerald-600" : "bg-sidebar-primary",
            )}
          >
            {isFaculty ? <ShieldCheck className="size-5" /> : <GraduationCap className="size-5" />}
          </span>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <p className="font-display text-base font-bold tracking-tight">
                CampusSync <span className="text-primary font-black">OS</span>
              </p>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase",
                  isFaculty
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-primary/20 text-primary border border-primary/30",
                )}
              >
                {isFaculty ? "FACULTY" : "STUDENT"}
              </span>
            </div>
            <p className="text-[10px] text-sidebar-foreground/65">
              {isFaculty ? "TSDC Faculty Circular OS" : "TSDC Academic Action OS"}
            </p>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1.5">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
            {isFaculty ? "Faculty Command Modules" : "Student Modules"}
          </p>
          {navLinks.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <l.icon
                  className={cn(
                    "size-4",
                    active
                      ? isFaculty
                        ? "text-emerald-500"
                        : "text-sidebar-primary"
                      : "text-sidebar-foreground/60",
                  )}
                />
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Demo Role Switcher */}
        <div className="mt-auto space-y-3 pt-4 border-t border-sidebar-border">
          {/* Quick Demo Role Toggle (Great for Teacher / Viva demo) */}
          <div className="rounded-xl bg-sidebar-accent/40 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-sidebar-foreground/70">
                Mode:{" "}
                <span className="font-bold text-sidebar-foreground">
                  {role === "admin" ? "👨‍🏫 Faculty" : "🎓 Student"}
                </span>
              </span>
              <button
                onClick={toggleRoleDemo}
                className="inline-flex items-center gap-1 rounded-md bg-sidebar-primary/20 px-2 py-0.5 text-[10px] font-semibold text-sidebar-primary hover:bg-sidebar-primary/30 transition-colors"
                title="Switch between Student and Faculty portal"
              >
                <ArrowLeftRight className="size-2.5" />
                Switch
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-sidebar-accent/50 p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="truncate text-sm font-semibold">{profile?.name || user.email}</p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {role === "admin" ? "🛡️ Administrator" : "🎓 Student Account"}
                </p>
              </div>
              <button
                onClick={toggleDarkMode}
                className="size-7 flex items-center justify-center rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70"
                title="Toggle Dark Mode"
              >
                {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              </button>
            </div>

            <button
              onClick={() => {
                void signOut().then(() => navigate({ to: "/" }));
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border bg-sidebar/50 px-2 py-1.5 text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-destructive/20 hover:text-destructive-foreground hover:border-destructive/30"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b bg-background/85 px-5 py-4 backdrop-blur-md lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-xl"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions}
        </header>

        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          {blocked ? (
            <div className="surface-card mx-auto max-w-md p-8 text-center">
              <ShieldCheck className="mx-auto size-12 text-destructive" />
              <h2 className="mt-4 text-xl font-bold">Access Denied</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                This area is restricted to college administrator accounts. You are currently in
                Student mode.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild variant="outline">
                  <Link to="/dashboard">Back to dashboard</Link>
                </Button>
                <Button onClick={toggleRoleDemo} className="gap-1.5">
                  <ArrowLeftRight className="size-3.5" /> Switch to Admin
                </Button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Floating OS-like AI Study Copilot Chatbot */}
      <AICopilot
        assignments={assignmentsQuery.data ?? []}
        notices={noticesQuery.data ?? []}
        onAddAssignment={handleAiAddAssignment}
      />
    </div>
  );
}
