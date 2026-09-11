# 🎓 StudyBoard — Smart Student Assignment & Deadline Manager

A full-stack academic productivity web application designed for college students and faculty. StudyBoard centralizes coursework, automatically calculates deadline risks, and integrates an **OS-Like AI Study Copilot**.

---

## 🚀 How to Run & Live Links

### Option 1: VS Code "Go Live" (Live Server)

1. Open this project in **Visual Studio Code**.
2. Click **Go Live** at the bottom-right corner of the status bar.
3. Your browser will immediately open:
   👉 `http://127.0.0.1:5500/index.html`

### Option 2: Vite Local Dev Server (React 19 + TanStack)

1. Open terminal and run:
   ```bash
   npm run dev
   ```
2. Open in browser:
   👉 `http://localhost:8080/`

---

## 🌟 Key Features

1. **Automatic Deadline Risk Engine**:
   - `DONE`: Status marked as Completed (Green)
   - `OVERDUE`: Pending & Deadline < Today (Red)
   - `HIGH`: Pending & Due in $\le 1$ day (Red)
   - `MEDIUM`: Pending & Due in $\le 3$ days (Amber)
   - `LOW`: Pending & Due in $> 3$ days (Blue)
2. **AI Study Copilot (OS-Style Window)**:
   - Voice speech-to-text & audio reading (TTS)
   - Natural language task creation (_"Add DBMS lab due tomorrow high priority"_)
   - Smart daily study schedule generation
3. **5 Stat Dashboard**: Total, Pending, Completed, Due this week, Overdue alert banner.
4. **Assignment CRUD**: Real-time search, status tabs (_All / Pending / Completed_), grid & table layouts.
5. **Notice Board**: Department circulars with search and author tags.
6. **Administrator Panel**: Notice publisher and student roster with submission stats.
7. **Role Switching**: Instant 1-click toggle between Student and Admin views.

---

## 📁 Project Structure

```
studyboard/
├── index.html                  # Standalone SPA (instant Go Live compatible)
├── src/
│   ├── components/             # AppShell, AICopilot, shadcn primitives
│   ├── lib/                    # assignments.ts, ai-assistant.ts, auth.tsx, storage-service.ts
│   ├── routes/                 # TanStack Router routes (__root, index, dashboard, assignments, notices, admin, auth)
│   └── styles.css              # Tailwind CSS tokens & OKLCH design system
---

## 📚 Documentation & Presentation Materials

- **[Mini Project Progress Presentation Guide (13 Mandatory Points)](file:///d:/Coding/My%20project/studyboard/documentation/mini-project-progress-presentation.md)** — Slide-by-slide preparation matching circular `TSDC/SP-06/375/2026-27` for Mrs. Abha Dhote & Dr. G.D. Giri.
- **[Viva Questions & Answers](file:///d:/Coding/My%20project/studyboard/documentation/viva-questions-and-answers.md)** — Core technical Q&A covering React 19, Vite, TanStack Router, Supabase, and the Risk Engine.

```
