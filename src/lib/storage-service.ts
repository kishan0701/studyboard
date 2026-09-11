import { supabase } from "@/integrations/supabase/client";
import { Assignment } from "./assignments";

const LOCAL_ASSIGNMENTS_KEY = "studyboard_assignments";
const LOCAL_NOTICES_KEY = "studyboard_notices";
const LOCAL_STUDENTS_KEY = "studyboard_students";

// Default initial datasets
const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: "asg-1",
    user_id: "student-demo-uuid",
    subject: "Database Management Systems",
    title: "ER Diagram for Hospital Management System",
    description:
      "Create complete Entity-Relationship diagram with cardinality, primary keys, and schema mapping.",
    deadline: getRelativeDate(1), // Tomorrow -> HIGH
    priority: "High",
    status: "Pending",
    created_at: new Date().toISOString(),
  },
  {
    id: "asg-2",
    user_id: "student-demo-uuid",
    subject: "Operating Systems",
    title: "Lab 4: CPU Scheduling Algorithms (Round Robin)",
    description:
      "Implement Round Robin and Priority scheduling in C++ with waiting time and turnaround time calculation.",
    deadline: getRelativeDate(3), // in 3 days -> MEDIUM
    priority: "Medium",
    status: "Pending",
    created_at: new Date().toISOString(),
  },
  {
    id: "asg-3",
    user_id: "student-demo-uuid",
    subject: "Mathematics",
    title: "Linear Algebra Problem Sheet 3",
    description: "Solve Eigenvalue and Eigenvector problems from Chapter 5 exercise 5.2.",
    deadline: getRelativeDate(8), // in 8 days -> LOW
    priority: "Low",
    status: "Pending",
    created_at: new Date().toISOString(),
  },
  {
    id: "asg-4",
    user_id: "student-demo-uuid",
    subject: "Web Technologies",
    title: "REST API Endpoint Integration",
    description:
      "Connect the frontend interface with backend authentication endpoints using Axios/Fetch.",
    deadline: getRelativeDate(-2), // 2 days ago -> OVERDUE
    priority: "High",
    status: "Pending",
    created_at: new Date().toISOString(),
  },
  {
    id: "asg-5",
    user_id: "student-demo-uuid",
    subject: "Computer Networks",
    title: "Socket Programming Client-Server Lab",
    description: "Demonstrate multi-client TCP echo server in Python with error handling.",
    deadline: getRelativeDate(4),
    priority: "Medium",
    status: "Completed", // Completed -> DONE
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_NOTICES = [
  {
    id: "not-1",
    title: "📢 Mid-Semester Practical Examination Schedule",
    message:
      "Department of Computer Science has scheduled mid-semester laboratory evaluations starting next Monday. All students are required to submit their signed lab journals beforehand.",
    created_by: "admin-demo-uuid",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "not-2",
    title: "⏳ Assignment Submission Window Extension",
    message:
      "Due to server maintenance on the college portal, the deadline for DBMS & OS submissions has been extended by 48 hours for all semester batches.",
    created_by: "admin-demo-uuid",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
  },
  {
    id: "not-3",
    title: "🚀 Annual Hackathon Registration Open",
    message:
      "Registration for the Inter-College Hackathon 2026 is officially open. Form teams of 3-4 members and register at the department lab.",
    created_by: "admin-demo-uuid",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

const DEFAULT_STUDENTS = [
  {
    id: "student-demo-uuid",
    name: "Rahul Verma (Student)",
    email: "student@college.edu",
    created_at: new Date().toISOString(),
  },
  {
    id: "stu-2",
    name: "Ananya Sharma",
    email: "ananya.s@college.edu",
    created_at: new Date().toISOString(),
  },
  {
    id: "stu-3",
    name: "Priya Patel",
    email: "priya.p@college.edu",
    created_at: new Date().toISOString(),
  },
  {
    id: "stu-4",
    name: "Kunal Singhal",
    email: "kunal.s@college.edu",
    created_at: new Date().toISOString(),
  },
  {
    id: "admin-demo-uuid",
    name: "Prof. Sharma (Admin)",
    email: "admin@college.edu",
    created_at: new Date().toISOString(),
  },
];

function getRelativeDate(diffDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + diffDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getStoredAssignments(): Assignment[] {
  try {
    const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(DEFAULT_ASSIGNMENTS));
      return DEFAULT_ASSIGNMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ASSIGNMENTS;
  }
}

export function saveStoredAssignments(list: Assignment[]) {
  try {
    localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function getStoredNotices() {
  try {
    const raw = localStorage.getItem(LOCAL_NOTICES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_NOTICES_KEY, JSON.stringify(DEFAULT_NOTICES));
      return DEFAULT_NOTICES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_NOTICES;
  }
}

export function saveStoredNotices(list: any[]) {
  try {
    localStorage.setItem(LOCAL_NOTICES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function getStoredStudents() {
  try {
    const raw = localStorage.getItem(LOCAL_STUDENTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(DEFAULT_STUDENTS));
      return DEFAULT_STUDENTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STUDENTS;
  }
}

/**
 * High-level Database Layer for StudyBoard
 * Tries Supabase first; if Supabase returns demo/network error, seamlessly falls back to persistent local storage.
 */
export const StorageService = {
  async fetchAssignments(userId?: string): Promise<Assignment[]> {
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("deadline", { ascending: true });
      if (!error && data && data.length > 0) {
        return data as Assignment[];
      }
    } catch {
      // Fallback
    }

    const local = getStoredAssignments();
    return local.sort((a, b) => a.deadline.localeCompare(b.deadline));
  },

  async insertAssignment(payload: Partial<Assignment> & { user_id: string }): Promise<Assignment> {
    const newAssignment: Assignment = {
      id: "asg-" + Date.now(),
      user_id: payload.user_id,
      subject: payload.subject || "General",
      title: payload.title || "New Assignment",
      description: payload.description || "",
      deadline: payload.deadline || getRelativeDate(3),
      priority: payload.priority || "Medium",
      status: payload.status || "Pending",
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("assignments")
        .insert(newAssignment)
        .select()
        .single();
      if (!error && data) {
        return data as Assignment;
      }
    } catch {
      // ignore
    }

    const list = getStoredAssignments();
    list.push(newAssignment);
    saveStoredAssignments(list);
    return newAssignment;
  },

  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<void> {
    try {
      await supabase.from("assignments").update(updates).eq("id", id);
    } catch {
      // ignore
    }

    const list = getStoredAssignments();
    const idx = list.findIndex((a) => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates } as Assignment;
      saveStoredAssignments(list);
    }
  },

  async deleteAssignment(id: string): Promise<void> {
    try {
      await supabase.from("assignments").delete().eq("id", id);
    } catch {
      // ignore
    }

    const list = getStoredAssignments().filter((a) => a.id !== id);
    saveStoredAssignments(list);
  },

  async fetchNotices(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("id, title, message, created_at")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // ignore
    }

    return getStoredNotices();
  },

  async insertNotice(title: string, message: string, created_by: string): Promise<any> {
    const newNotice = {
      id: "not-" + Date.now(),
      title,
      message,
      created_by,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from("notices").insert(newNotice);
    } catch {
      // ignore
    }

    const list = getStoredNotices();
    list.unshift(newNotice);
    saveStoredNotices(list);
    return newNotice;
  },

  async deleteNotice(id: string): Promise<void> {
    try {
      await supabase.from("notices").delete().eq("id", id);
    } catch {
      // ignore
    }

    const list = getStoredNotices().filter((n: any) => n.id !== id);
    saveStoredNotices(list);
  },

  async fetchStudents(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, created_at")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // ignore
    }

    return getStoredStudents();
  },
};
