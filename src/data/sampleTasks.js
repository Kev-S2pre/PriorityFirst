/**
 * Sample tasks covering work, studies, home, health, and social life
 * Relative deadlines ensure dates are always fresh and functional upon first load
 */

export function generateSampleTasks() {
  const now = new Date();
  
  const formatDate = (daysFromNow, hours = 17, minutes = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hours, minutes, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
      iso: d.toISOString()
    };
  };

  const d0 = formatDate(0, 23, 59); // Due today midnight
  const d1 = formatDate(1, 14, 0);  // Due tomorrow 2 PM
  const d2 = formatDate(2, 17, 0);  // Due in 2 days 5 PM
  const d3 = formatDate(3, 10, 30); // Due in 3 days 10:30 AM
  const d5 = formatDate(5, 23, 59); // Due in 5 days
  const dNeg1 = formatDate(-1, 12, 0); // 1 day overdue

  return [
    {
      id: 'task-101',
      title: 'Finish quarterly budget report',
      description: 'Compile Q3 spending, compare against forecast, and write a one-page summary for the team lead.',
      category: 'work / professional',
      deadlineDate: d0.date,
      deadlineTime: d0.time,
      difficulty: 4,
      estimatedHours: 3.5,
      importance: 'Critical',
      status: 'in_progress',
      notes: 'Use the finance export from Monday. Highlight the two biggest variances.',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      completedAt: null
    },
    {
      id: 'task-102',
      title: 'Prepare slides for client meeting',
      description: 'Draft 8–10 slides covering project status, risks, and next milestones.',
      category: 'project',
      deadlineDate: d1.date,
      deadlineTime: d1.time,
      difficulty: 3,
      estimatedHours: 2.5,
      importance: 'High',
      status: 'pending',
      notes: 'Reuse the template from the last review.',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      completedAt: null
    },
    {
      id: 'task-103',
      title: 'Study for certification exam – chapter 4',
      description: 'Review notes and complete the practice questions for chapter 4.',
      category: 'school / studies',
      deadlineDate: d2.date,
      deadlineTime: d2.time,
      difficulty: 4,
      estimatedHours: 2,
      importance: 'High',
      status: 'pending',
      notes: 'Aim for at least 80% on the practice set.',
      createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
      completedAt: null
    },
    {
      id: 'task-104',
      title: 'Pay electricity and internet bills',
      description: 'Pay both bills online before the due date to avoid late fees.',
      category: 'responsibilities',
      deadlineDate: d1.date,
      deadlineTime: d1.time,
      difficulty: 1,
      estimatedHours: 0.5,
      importance: 'High',
      status: 'pending',
      notes: 'Account numbers are in the household folder.',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      completedAt: null
    },
    {
      id: 'task-105',
      title: 'Dentist appointment',
      description: 'Routine check-up and cleaning.',
      category: 'errands',
      deadlineDate: d3.date,
      deadlineTime: d3.time,
      difficulty: 1,
      estimatedHours: 1.5,
      importance: 'Medium',
      status: 'pending',
      notes: 'Bring insurance card. Leave 20 minutes early.',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      completedAt: null
    },
    {
      id: 'task-106',
      title: 'Gym – strength workout',
      description: 'Upper-body session plus 20 minutes of cardio.',
      category: 'training / exercise',
      deadlineDate: d2.date,
      deadlineTime: d2.time,
      difficulty: 2,
      estimatedHours: 1.5,
      importance: 'Medium',
      status: 'pending',
      notes: '',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      completedAt: null
    },
    {
      id: 'task-107',
      title: 'Family dinner',
      description: 'Dinner at home with family; pick up dessert on the way.',
      category: 'hangouts / social activities',
      deadlineDate: d5.date,
      deadlineTime: d5.time,
      difficulty: 1,
      estimatedHours: 2,
      importance: 'Medium',
      status: 'pending',
      notes: '',
      createdAt: new Date(Date.now() - 3600000 * 40).toISOString(),
      completedAt: null
    },
    {
      id: 'task-108',
      title: 'Weekly grocery run',
      description: 'Buy groceries for the week from the shopping list.',
      category: 'errands',
      deadlineDate: dNeg1.date,
      deadlineTime: dNeg1.time,
      difficulty: 1,
      estimatedHours: 1,
      importance: 'Low',
      status: 'completed',
      notes: '',
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 20).toISOString()
    }
  ];
}
