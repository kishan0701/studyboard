import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  RotateCcw,
  Loader2,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Sparkles,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { StorageService } from "@/lib/storage-service";
import {
  deadlineRisk,
  formatDate,
  relativeDeadline,
  riskStyles,
  type Assignment,
} from "@/lib/assignments";

export const Route = createFileRoute("/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — Smart Student Assignment Manager" },
      {
        name: "description",
        content:
          "Add, edit, complete and delete your assignments with automatic risk badges and live filtering.",
      },
      { property: "og:title", content: "Assignments — Smart Student Assignment Manager" },
      {
        property: "og:description",
        content:
          "Add, edit, complete and delete your assignments with automatic risk badges and live filtering.",
      },
    ],
  }),
  component: AssignmentsPage,
});

type FormState = {
  subject: string;
  title: string;
  description: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
};

const emptyForm: FormState = {
  subject: "",
  title: "",
  description: "",
  deadline: "",
  priority: "Medium",
};

function AssignmentsPage() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [filter, setFilter] = useState<"all" | "Pending" | "Completed">("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const { data, isLoading } = useQuery({
    queryKey: ["assignments", user?.id],
    enabled: !!user,
    queryFn: () => StorageService.fetchAssignments(user?.id),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["assignments"] });

  const saveMutation = useMutation({
    mutationFn: async (values: FormState) => {
      if (editing) {
        await StorageService.updateAssignment(editing.id, values);
      } else {
        await StorageService.insertAssignment({
          ...values,
          user_id: user!.id,
          status: "Pending",
        });
      }
    },
    onSuccess: () => {
      toast.success(
        editing ? "Assignment updated successfully" : "Assignment created successfully",
      );
      setDialogOpen(false);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: async (a: Assignment) => {
      const nextStatus = a.status === "Completed" ? "Pending" : "Completed";
      await StorageService.updateAssignment(a.id, { status: nextStatus });
    },
    onSuccess: () => {
      toast.success("Assignment status updated");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await StorageService.deleteAssignment(id);
    },
    onSuccess: () => {
      toast.success("Assignment deleted");
      setDeleteTarget(null);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (a: Assignment) => {
    setEditing(a);
    setForm({
      subject: a.subject,
      title: a.title,
      description: a.description || "",
      deadline: a.deadline,
      priority: a.priority,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.title.trim()) {
      return setFormError("Subject and title are required.");
    }
    if (!form.deadline) return setFormError("Please choose a submission deadline date.");
    setFormError(null);
    saveMutation.mutate({
      ...form,
      subject: form.subject.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
    });
  };

  const rows = (data ?? [])
    .filter((a) => (filter === "all" ? true : a.status === filter))
    .filter((a) =>
      search.trim()
        ? `${a.title} ${a.subject} ${a.description}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
        : true,
    );

  return (
    <AppShell
      title="Assignments Manager"
      subtitle={
        role === "admin"
          ? "All student assignments with real-time deadline risk tags"
          : "Manage your coursework, track deadlines, and eliminate overdue risks"
      }
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openNew} className="gap-1.5 shadow-sm">
            <Plus className="size-4" /> Add Assignment
          </Button>
        </div>
      }
    >
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, subject or keyword..."
            className="pl-9 h-10 rounded-xl bg-card"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Tabs */}
          <div className="flex rounded-xl border border-border bg-card p-1 shadow-2xs">
            {(["all", "Pending", "Completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>

          {/* Grid vs Table View Switcher */}
          <div className="hidden sm:flex rounded-xl border border-border bg-card p-1 shadow-2xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Card grid view"
              aria-label="Card grid view"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === "table"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="surface-card mt-6 p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <AlertCircle className="size-6" />
          </div>
          <p className="mt-4 font-bold text-base">No assignments found</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            {search || filter !== "all"
              ? "No assignments match your current search and filter criteria."
              : "You have no assignments yet. Add your first task and its deadline risk will be computed automatically."}
          </p>
          <Button className="mt-5 rounded-xl" onClick={openNew}>
            <Plus className="size-4 mr-1.5" /> Add Assignment
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* Cards Grid View */
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((a) => {
            const risk = deadlineRisk(a);
            const isCompleted = a.status === "Completed";
            return (
              <article
                key={a.id}
                className={`surface-card flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isCompleted ? "opacity-80 bg-muted/20" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {a.subject}
                    </span>
                    <h3
                      className={`mt-1.5 text-base font-bold leading-snug ${
                        isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {a.title}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold tracking-wide shadow-2xs ${riskStyles[risk]}`}
                  >
                    {risk}
                  </span>
                </div>

                {a.description && (
                  <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {a.description}
                  </p>
                )}

                <div className="mt-auto pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-primary" />
                      <span>{formatDate(a.deadline)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">
                        {isCompleted ? "Completed" : relativeDeadline(a.deadline)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant={isCompleted ? "outline" : "default"}
                      className="h-8 flex-1 text-xs rounded-xl"
                      onClick={() => statusMutation.mutate(a)}
                      disabled={statusMutation.isPending}
                    >
                      {isCompleted ? (
                        <>
                          <RotateCcw className="size-3.5 mr-1" /> Reopen
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5 mr-1" /> Mark Done
                        </>
                      )}
                    </Button>

                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8 rounded-xl shrink-0"
                      onClick={() => openEdit(a)}
                      title="Edit Assignment"
                    >
                      <Pencil className="size-3.5" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                      onClick={() => setDeleteTarget(a)}
                      title="Delete Assignment"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="surface-card mt-6 overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Title & Subject</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => {
                const risk = deadlineRisk(a);
                const isCompleted = a.status === "Completed";
                return (
                  <TableRow key={a.id} className={isCompleted ? "opacity-75" : ""}>
                    <TableCell>
                      <Button
                        size="icon"
                        variant={isCompleted ? "default" : "outline"}
                        className={`size-7 rounded-lg ${isCompleted ? "bg-success hover:bg-success/90" : ""}`}
                        onClick={() => statusMutation.mutate(a)}
                      >
                        <Check className="size-3.5" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p
                          className={`text-sm font-semibold ${isCompleted ? "line-through text-muted-foreground" : ""}`}
                        >
                          {a.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{a.subject}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {formatDate(a.deadline)} ({relativeDeadline(a.deadline)})
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium">{a.priority}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${riskStyles[risk]}`}
                      >
                        {risk}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => openEdit(a)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(a)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editing ? "Edit Assignment" : "Add New Assignment"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill in the coursework details. Deadline risk will be automatically computed from the
              submission date.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-medium">
                  Subject / Course Name
                </Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Database Management"
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deadline" className="text-xs font-medium">
                  Submission Deadline
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-medium">
                Assignment Title
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Lab 3: ER Diagram & Relational Schema"
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-medium">
                Description / Deliverables
              </Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Include questions, submission format, lab requirements…"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-xs font-medium">
                Priority Level
              </Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as FormState["priority"] })}
              >
                <SelectTrigger id="priority" className="rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low Priority</SelectItem>
                  <SelectItem value="Medium">Medium Priority</SelectItem>
                  <SelectItem value="High">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                {formError}
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
                {editing ? "Save Changes" : "Create Assignment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">Delete this assignment?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              “{deleteTarget?.title}” will be permanently removed from your StudyBoard workspace.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
