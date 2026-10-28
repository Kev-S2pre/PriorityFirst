/**
 * Sample tasks grounded in Engineering & Academic coursework
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
      title: 'Structural Steel Column Buckling Calculation',
      description: 'Solve Euler critical buckling load calculations and safety factors for W-shape columns under eccentric axial loading.',
      category: 'calculation',
      deadlineDate: d0.date,
      deadlineTime: d0.time,
      difficulty: 4, // Difficult
      estimatedHours: 3.5,
      importance: 'Critical',
      status: 'in_progress',
      notes: 'Refer to AISC Steel Manual Table 4-1 and lecture notes 6B. Double-check effective length factor K.',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      completedAt: null
    },
    {
      id: 'task-102',
      title: 'Fluid Mechanics Bernoulli & Venturi Lab Activity',
      description: 'Record manometric height readings, calculate discharge coefficients (Cd), and evaluate Reynolds numbers across test velocities.',
      category: 'laboratory activity',
      deadlineDate: d1.date,
      deadlineTime: d1.time,
      difficulty: 3, // Moderate
      estimatedHours: 2.5,
      importance: 'High',
      status: 'pending',
      notes: 'Collaborate with lab group 3 for raw pressure tap data. Include calibration graphs.',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      completedAt: null
    },
    {
      id: 'task-103',
      title: 'Thermodynamics Refrigeration Cycle Performance Report',
      description: 'Write a comprehensive technical report analyzing COP and exergy destruction in a vapor compression cycle with R-134a.',
      category: 'report',
      deadlineDate: d2.date,
      deadlineTime: d2.time,
      difficulty: 3, // Moderate
      estimatedHours: 4.0,
      importance: 'High',
      status: 'pending',
      notes: 'Include T-s and P-h diagrams plotted with property tables. Follow IEEE citation format.',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      completedAt: null
    },
    {
      id: 'task-104',
      title: 'Mechatronics Capstone Autonomous Rover Milestone 2',
      description: 'Integrate ultrasonic distance sensors with PID motor controller on STM32 microcontroller and test obstacle avoidance algorithms.',
      category: 'project',
      deadlineDate: d5.date,
      deadlineTime: d5.time,
      difficulty: 5, // Very Challenging
      estimatedHours: 8.0,
      importance: 'Critical',
      status: 'in_progress',
      notes: 'Calibrate PWM duty cycle for steering offset. Prepare demonstration video for faculty panel.',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      completedAt: null
    },
    {
      id: 'task-105',
      title: 'Differential Equations Boundary Value Problem Set',
      description: 'Homework assignment 4: Fourier series expansion and solving 1D heat equation with Dirichlet boundary conditions.',
      category: 'assignment',
      deadlineDate: d3.date,
      deadlineTime: d3.time,
      difficulty: 4, // Difficult
      estimatedHours: 3.0,
      importance: 'Medium',
      status: 'pending',
      notes: 'Use MATLAB to verify eigenvalues and eigenfunctions before final submission.',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      completedAt: null
    },
    {
      id: 'task-106',
      title: 'Engineering Ethics Seminar Reflection & Prep',
      description: 'Read case study on the Hyatt Regency walkway collapse and write a 500-word reflection on professional accountability.',
      category: 'personal responsibility',
      deadlineDate: d5.date,
      deadlineTime: '18:00',
      difficulty: 1, // Very Easy
      estimatedHours: 1.0,
      importance: 'Low',
      status: 'pending',
      notes: 'Review NSPE Code of Ethics Section II.',
      createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
      completedAt: null
    },
    {
      id: 'task-107',
      title: 'Circuit Analysis Thevenin Equivalent Drill',
      description: 'Completed practice drill verifying maximum power transfer theorem on dual-source bridge circuit.',
      category: 'assignment',
      deadlineDate: dNeg1.date,
      deadlineTime: '23:59',
      difficulty: 2, // Easy
      estimatedHours: 1.5,
      importance: 'Medium',
      status: 'completed',
      notes: 'Checked nodal analysis answers with LTSpice simulation.',
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 20).toISOString()
    }
  ];
}
