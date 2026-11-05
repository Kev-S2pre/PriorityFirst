# PriorityFirst (PF) — Time-Management & Task-Prioritization System

**PriorityFirst** is a responsive web app that helps anyone — students, professionals, athletes, or people simply running a busy life — organize, schedule, and prioritize everything on their plate: work, studies, projects, home responsibilities, errands, health, social life, hobbies, and rest.

---

## 1. System Overview & Core Philosophy

PriorityFirst uses Multi-Criteria Decision Analysis (MCDA) to take the guesswork out of deciding what to do next. Instead of claiming unverifiable "AI/ML", it uses a **transparent, deterministic, and explainable prioritization engine** that balances:

1. **Deadline Urgency ($S_u$):** How close the due date and time are, with automatic overdue handling.
2. **Workload Pressure ($S_w$):** Estimated duration compared with the time left before the deadline ($E / H$), plus absolute effort.
3. **Importance ($S_i$):** How much the outcome matters to you (Critical, High, Medium, Low).
4. **Difficulty ($S_d$):** Level 1 (Very Easy) to Level 5 (Very Challenging) — harder tasks need fresh focus and an earlier start.

Every recommendation comes with a **plain-English rationale** explaining *why* it got its ranking.

---

## 2. Core Features

### A. Accounts & Profiles
- **Sign up / sign in / password reset** through Supabase Auth (email confirmation supported).
- **Optional profile details:** classification (Student, Professional, Worker, Athlete, Other / Personal use), institution type (school, company, government, organization), verified institution, and course or department. All are optional — the app works for personal use without them.
- **Profile picture** stored with the account.

### B. Dashboard
- **Metric cards:** Total Tasks, In Progress, Due Today, Overdue, Completed, and Active Workload Hours.
- **Urgent alert banners** for overdue tasks or tasks due today.
- **Top Priority Queue:** the top 3 recommended tasks with score badges and explanations.
- **Workload by Category:** time commitment across your categories.

### C. Task Management (Full CRUD)
- **Create, view, edit, complete, and delete** tasks.
- **Fields:** title, description, category, deadline date and time, optional start/end time, difficulty (1–5), estimated duration, importance, status (`pending`, `in_progress`, `completed`, auto-flagged `overdue`), notes, and an optional reminder.
- **Categories:** Work / Professional, School / Studies, Project, Personal & Home, Errands / Appointments, Health & Fitness, Social / Family, Hobbies & Gaming, Rest / Personal Time, Other. Tasks saved with the older student-only categories (assignment, lab activity, calculation, report, personal responsibility) are mapped automatically.
- **Client-side validation** with field feedback.

### D. Transparent Prioritizer
- **Formula inspector:**
  $$\text{Priority Score} = (S_u \times W_u) + (S_i \times W_i) + (S_w \times W_w) + (S_d \times W_d)$$
- **Presets:**
  - *Balanced* (Urgency 40%, Importance 25%, Workload 20%, Difficulty 15%)
  - *Deadline-Driven / Crunch Mode* (Urgency 60%, Importance 20%, Workload 15%, Difficulty 5%)
  - *Cognitive / Deep Work First* (25% each)
  - *Momentum / Quick Wins* (Urgency 35%, Importance 35%, Workload 10%, Difficulty 20%)
- **Custom weight sliders** and **per-task subscore bars**.

### E. Schedule & Workload Calendar
- **Weekly grid** with deadlines, daily workload hours, and today highlighted.
- **Daily timeline** ordered by time.
- **Capacity warning** for days over 8 hours of planned work, to help prevent burnout.
- **Conflict detector** for tasks due at the same time.

### F. Notifications & Reminders
- **In-app notification center** for overdue, due-today, and upcoming tasks.
- **Audio chime** generated with the Web Audio API.
- **Browser desktop notifications** (while the app tab is open).

### G. Search, Filtering & Sorting
- Search across titles, descriptions, categories, and notes.
- Filter by status, category, difficulty, and importance.
- Sort by priority score, deadline, difficulty, or duration; grid or table view.

### H. Progress Analytics
- Completion rate, hours completed vs remaining, on-time score.
- Per-category progress and difficulty distribution.

---

## 3. Data Storage & Architecture

- **Frontend:** React 19 + Vite, icons from `lucide-react`. Deployed as a single-page app (see `vercel.json`).
- **Cloud mode (Supabase):** When `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set, accounts, tasks, settings, and profile pictures are stored in Supabase and follow the user across devices. Row-level security limits every user to their own rows. Setup steps: [`supabase/SETUP.md`](supabase/SETUP.md).
- **Local mode:** Without Supabase configured, data is saved in the browser's `localStorage` only. This mode is for demos and offline testing — don't use real passwords in it.
- **Service layer:** `src/services/` holds storage, cloud sync, auth, prioritization, notifications, and validation, separate from the UI components.
- **Backup & portability:** export/import a JSON backup, load a sample task set, or clear all data (with confirmation).

---

## 4. Getting Started Locally

```bash
cd d:/SchedulePlanner
npm install
npm run dev        # http://127.0.0.1:5173/
npm run build      # production build
npm run lint
```

To enable cloud saving, follow [`supabase/SETUP.md`](supabase/SETUP.md) and add the two `VITE_SUPABASE_*` variables to `.env.local`.
