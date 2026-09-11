export type Assignment = {
  id: string;
  user_id: string;
  subject: string;
  title: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "Completed";
  created_at: string;
};

export type Risk = "DONE" | "OVERDUE" | "HIGH" | "MEDIUM" | "LOW";

/** Whole-day difference between a deadline (YYYY-MM-DD) and today, in local time. */
export function daysUntil(deadline: string): number {
  const [y, m, d] = deadline.split("-").map(Number);
  const due = new Date(y!, (m ?? 1) - 1, d ?? 1);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((due.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Deadline risk rule (as specified in the project guide):
 * completed -> DONE, overdue + pending -> OVERDUE,
 * <= 1 day -> HIGH, <= 3 days -> MEDIUM, otherwise LOW.
 */
export function deadlineRisk(assignment: Pick<Assignment, "deadline" | "status">): Risk {
  if (assignment.status === "Completed") return "DONE";
  const diff = daysUntil(assignment.deadline);
  if (diff < 0) return "OVERDUE";
  if (diff <= 1) return "HIGH";
  if (diff <= 3) return "MEDIUM";
  return "LOW";
}

export const riskStyles: Record<Risk, string> = {
  DONE: "bg-success/12 text-success border-success/25",
  OVERDUE: "bg-destructive/12 text-destructive border-destructive/25",
  HIGH: "bg-destructive/12 text-destructive border-destructive/25",
  MEDIUM: "bg-warning/15 text-warning-foreground border-warning/40",
  LOW: "bg-info/12 text-info border-info/25",
};

export function computeStats(items: Assignment[]) {
  const pending = items.filter((a) => a.status === "Pending");
  return {
    total: items.length,
    pending: pending.length,
    completed: items.length - pending.length,
    dueThisWeek: pending.filter((a) => {
      const d = daysUntil(a.deadline);
      return d >= 0 && d <= 7;
    }).length,
    overdue: pending.filter((a) => daysUntil(a.deadline) < 0).length,
  };
}

export function formatDate(deadline: string) {
  const [y, m, d] = deadline.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function relativeDeadline(deadline: string) {
  const d = daysUntil(deadline);
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  if (d < 0) return `${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} overdue`;
  return `In ${d} days`;
}
