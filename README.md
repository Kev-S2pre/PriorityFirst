# PriorityFirst (PF) — Time-Management & Task-Prioritization System

**PriorityFirst** is a modern, responsive web application engineered to help students and professionals organize, analyze, and prioritize academic coursework, engineering calculations, laboratory activities, technical reports, and personal responsibilities.

---

## 1. System Overview & Core Philosophy

PriorityFirst incorporates Multi-Criteria Decision Analysis (MCDA) to eliminate guesswork in student task scheduling. Instead of claiming unverifiable "AI/ML", PriorityFirst uses a **100% transparent, deterministic, and explainable prioritization engine** that balances:

1. **Deadline Urgency ($S_u$):** Proximity to due date and time, with automatic overdue handling.
2. **Workload Pressure ($S_w$):** Ratio of estimated duration to remaining time window ($E / H$) plus absolute effort required.
3. **Academic Importance ($S_i$):** Strategic course weights (Critical, High, Medium, Low).
4. **Cognitive Difficulty ($S_d$):** Academic complexity (Level 1 Very Easy to Level 5 Very Challenging) demanding fresh cognitive alertness.

Every prioritized recommendation provides a **plain-English rationale** explaining *why* it received its ranking.

---

## 2. Core Features

### A. Authentication & User Session Gate
- **Protected Navigation:** Unauthenticated visitors are presented with the authentication portal; the dashboard and scheduling views remain protected until login.
- **User Registration:** Supports registering accounts with full name, email, department/program, institution, classification, and secure salted hashing.
- **User Sign In:** Validates email and password securely against registered user credentials using Web Crypto API.
- **Logout:** Clears the active session after confirmation and returns immediately to the sign-in portal.
- **Data Preservation Guarantee:** Authentication states are isolated in `priorityfirst_auth_session_v1` and do not alter or overwrite existing task and scheduling data.
- **Transparency Notice:** Prominently identifies the frontend simulation mode and reminds users not to enter real-world production passwords.

### B. Dynamic Dashboard
- **Calculated Metric Cards:** Real-time counters for Total Tasks, In Progress, Due Today, Overdue Backlog, Completed, and Active Workload Hours. All computed directly from saved tasks.
- **Urgent Alert Banners:** Instant notification banner for overdue submissions or tasks due today before midnight.
- **Top Priority Action Queue:** Top recommended tasks ranked #1, #2, and #3 with priority score badges and plain-English explanation boxes.
- **Coursework Category Workload:** Distribution meter showing time commitment across assignments, projects, labs, and calculations.

### B. Task Management (Full CRUD)
- **Create, View, Edit, Complete, & Delete** tasks with immediate UI updates.
- **Fields Supported:**
  - **Title & Description:** Detailed problem statement / rubric requirements.
  - **Categories:** `assignment`, `project`, `laboratory activity`, `calculation`, `report`, `personal responsibility`.
  - **Deadline Date & Due Time:** Exact date and 24h cutoff time.
  - **Difficulty Level:** 1 (Very Easy) to 5 (Very Challenging).
  - **Estimated Duration:** Decimal hours (e.g., 2.5h, 4.0h).
  - **Importance / Priority:** `Critical`, `High`, `Medium`, `Low`.
  - **Task Status:** `pending`, `in_progress`, `completed`, and dynamically flagged `overdue`.
  - **Optional Notes & References:** Scratchpad for formula references, AISC/IEEE standards, textbook chapters, and lab partners.
- **Validation:** Required fields validated client-side with feedback.

### C. Transparent Prioritizer Workspace
- **Formula Inspector:** Live display of the mathematical equation:
  $$\text{Priority Score} = (S_u \times W_u) + (S_i \times W_i) + (S_w \times W_w) + (S_d \times W_d)$$
- **Preset Models:**
  - *Balanced Engineering Student* (Urgency 40%, Importance 25%, Workload 20%, Difficulty 15%)
  - *Deadline-Driven / Crunch Mode* (Urgency 60%, Importance 20%, Workload 15%, Difficulty 5%)
  - *Cognitive / Deep Work First* (Urgency 25%, Importance 25%, Workload 25%, Difficulty 25%)
  - *Momentum / Quick Wins* (Urgency 35%, Importance 35%, Workload 10%, Difficulty 20%)
- **Custom Weight Sliders:** Full user control over weighting percentages.
- **Visual Breakdown Bars:** Displays each task's individual subscores for Urgency, Workload, Importance, and Difficulty.

### D. Schedule & Workload Calendar
- **Weekly Grid View:** 7-day calendar displaying scheduled deadlines, total workload hours per day, and "Today" highlighting.
- **Daily Hourly Timeline:** Chronological breakdown by due times.
- **Realistic Capacity Warning:** Flags overloaded days exceeding 8 hours of estimated workload to protect against student burnout.
- **Simultaneous Conflict Detector:** Alerts when multiple tasks have identical deadline cutoff times.

### E. Notifications & Reminders
- **In-App Notification Center:** Popover dropdown in navbar with color-coded alerts for Overdue (Critical), Due Today (Warning), and Approaching Deadlines (Info).
- **Audio Chime:** Synthesized two-tone chime via Web Audio API (no external MP3/audio files needed).
- **Browser Desktop Notifications:** Integration with browser Notification API (works while tab is open).

### F. Search, Filtering, & Sorting
- **Instant Search:** Matches titles, descriptions, categories, and personal notes.
- **Multi-Filter:** Filter by Status, Category, Difficulty Level (1-5), and Importance.
- **Multi-Sort:** Sort by Priority Score (Recommended), Deadline (Earliest/Latest), Difficulty (Highest), and Duration (Longest/Shortest).
- **View Modes:** Toggle between Grid Cards and Table List layout.

### G. Progress Tracking & Performance Analytics
- **Completion Velocity Metric:** Overall % of coursework completed.
- **Workload Invested:** Hours completed vs active hours remaining.
- **On-Time Discipline Score:** Percentage of submissions completed before deadline.
- **Category Progress Meters:** Completion rates and hours per category.
- **Cognitive Difficulty Distribution:** Balance of Level 1-5 coursework.

---

## 3. Data Storage & Architecture

- **Browser LocalStorage (`priorityfirst_tasks_v1`):** All tasks, custom weights, and theme settings persist safely in your browser across sessions.
- **Privacy & Scope:** Data is private and stored on the user's device/browser.
- **Decoupled Architecture:** `src/services/storageService.js` provides a clean API ready to be swapped with a REST backend or database in the future if required.
- **Backup & Portability:**
  - **Export JSON Backup:** Download complete database as a `.json` file.
  - **Import JSON Backup:** Restore tasks and settings from any previous backup.
  - **Load Engineering Samples:** Restore realistic engineering coursework sample data anytime.
  - **Clear All Data:** Reset storage with safety confirmation.

---

## 4. Getting Started Locally

```bash
# Navigate to directory
cd d:/SchedulePlanner

# Install dependencies
npm install

# Start development server
npm run dev
# Server runs on http://127.0.0.1:5173/

# Verify production build
npm run build
```
