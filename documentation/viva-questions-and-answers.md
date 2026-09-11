# 🎓 StudyBoard — College Viva Questions & Answers

### Q1. Why did you choose this project?

**Answer:** Students receive assignments across multiple disconnected channels (WhatsApp groups, LMS, notebook scribbles), leading to missed deadlines and last-minute rushes. StudyBoard centralizes all coursework, visualizes deadline urgency with an automated Risk Engine, and provides a verified department notice board.

---

### Q2. What is the frontend stack?

**Answer:** The frontend is built with React 19, Vite, TanStack Router (file-based routing), TanStack Query v5 (for state management and cache invalidation), and Tailwind CSS with OKLCH design tokens.

---

### Q3. What is the backend and database architecture?

**Answer:** The backend uses PostgreSQL with Supabase providing Authentication and Row-Level Security (RLS) policies, supported by a resilient local-first hybrid storage layer.

---

### Q4. How does the Deadline Risk Engine work?

**Answer:** The system calculates the whole-day difference between today's local date and the assignment deadline:

- `Completed` $\rightarrow$ **DONE** (Green)
- `Pending & diff < 0` $\rightarrow$ **OVERDUE** (Red)
- `Pending & diff <= 1` $\rightarrow$ **HIGH RISK** (Red)
- `Pending & diff <= 3` $\rightarrow$ **MEDIUM RISK** (Amber)
- `Pending & diff > 3` $\rightarrow$ **LOW RISK** (Blue)

---

### Q5. What is the difference between Authentication and Authorization in your project?

**Answer:**

- **Authentication**: Verifies user identity via email/password or OAuth.
- **Authorization**: Determines what a signed-in user is permitted to do using role-based access control (`student` vs `admin`). For instance, only administrators can publish department notices or access `/admin`.

---

### Q6. How does the AI Study Copilot assist students?

**Answer:** The AI Copilot is an OS-inspired floating assistant that:

1. Parses natural language text to create assignments automatically.
2. Analyzes pending workloads to generate customized daily study blocks (Pomodoro routine).
3. Supports voice recognition and text-to-speech audio feedback.
4. Explains core academic concepts in DBMS, OS, DSA, and Web Development.

---

### Q7. What are the CRUD operations implemented in the application?

**Answer:**

- **Create**: Add new assignment with Subject, Title, Description, Deadline date, and Priority.
- **Read**: Display filtered assignments with live search by title/subject.
- **Update**: Edit details or toggle status between Pending and Completed.
- **Delete**: Permanently remove assignments with confirmation dialog.
