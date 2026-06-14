import type { SheetMatrix } from '../io/matrix';

export interface SpreadsheetTemplate {
  id: string;
  title: string;
  gradeBand: string;
  category: 'Everyday' | 'Financial Literacy' | 'Teacher';
  description: string;
  sampleData: SheetMatrix;
}

export const spreadsheetTemplates: SpreadsheetTemplate[] = [
  {
    id: 'weekly-reading-log',
    title: 'Weekly Reading Log',
    gradeBand: 'Grades 3-8',
    category: 'Everyday',
    description: 'Track minutes read, pages finished, and book notes.',
    sampleData: [
      ['Day', 'Title', 'Minutes', 'Pages', 'Note'],
      ['Monday', 'The Wild Robot', '20', '12', 'Main character changes'],
      ['Tuesday', 'The Wild Robot', '25', '16', 'New problem appears'],
      ['Wednesday', '', '', '', ''],
      ['Thursday', '', '', '', ''],
      ['Friday', '', '', '', ''],
    ],
  },
  {
    id: 'homework-planner',
    title: 'Homework Planner',
    gradeBand: 'Grades 3-8',
    category: 'Everyday',
    description: 'Keep assignments, due dates, and status in one sheet.',
    sampleData: [
      ['Subject', 'Assignment', 'Due Date', 'Status'],
      ['Math', 'Fractions practice', 'Monday', 'Started'],
      ['Science', 'Plant observation', 'Wednesday', 'Not started'],
      ['Reading', 'Chapter notes', 'Friday', 'Done'],
    ],
  },
  {
    id: 'science-observation-log',
    title: 'Science Observation Log',
    gradeBand: 'Grades 3-8',
    category: 'Everyday',
    description: 'Record observations, measurements, and evidence.',
    sampleData: [
      ['Date', 'Object/System', 'Observation', 'Measurement', 'Question'],
      ['Day 1', 'Plant A', 'Two leaves', '4 cm', 'What helps it grow?'],
      ['Day 4', 'Plant A', 'New leaf', '5 cm', 'Did sunlight matter?'],
      ['Day 7', 'Plant A', 'Stem taller', '7 cm', ''],
    ],
  },
  {
    id: 'allowance-tracker',
    title: 'Allowance Tracker',
    gradeBand: 'Grades 3-8',
    category: 'Financial Literacy',
    description: 'Track earning, spending, saving, and sharing.',
    sampleData: [
      ['Date', 'Description', 'Earned', 'Spent', 'Saved', 'Shared', 'Balance'],
      ['Week 1', 'Allowance', '5.00', '0.00', '2.00', '1.00', '5.00'],
      ['Week 1', 'Snack', '0.00', '1.50', '0.00', '0.00', '3.50'],
      ['Week 2', 'Chores', '4.00', '0.00', '2.00', '0.50', '7.50'],
    ],
  },
  {
    id: 'check-register',
    title: 'Check Register',
    gradeBand: 'Grades 6-8',
    category: 'Financial Literacy',
    description: 'Practice deposits, withdrawals, and running balance.',
    sampleData: [
      ['Date', 'Transaction', 'Deposit', 'Withdrawal', 'Balance'],
      ['8/1', 'Starting balance', '25.00', '0.00', '25.00'],
      ['8/3', 'Deposit', '10.00', '0.00', '35.00'],
      ['8/5', 'Notebook', '0.00', '4.50', '30.50'],
      ['8/9', 'Class fundraiser', '0.00', '3.00', '27.50'],
    ],
  },
  {
    id: 'classroom-store-budget',
    title: 'Classroom Store Budget',
    gradeBand: 'Grades 4-8',
    category: 'Financial Literacy',
    description: 'Compare costs, quantities, revenue, and profit.',
    sampleData: [
      ['Item', 'Cost Each', 'Quantity', 'Price Each', 'Revenue', 'Profit'],
      ['Pencil', '0.10', '30', '0.25', '7.50', '4.50'],
      ['Sticker', '0.05', '50', '0.20', '10.00', '7.50'],
      ['Bookmark', '0.15', '20', '0.50', '10.00', '7.00'],
    ],
  },
  {
    id: 'simple-gradebook',
    title: 'Simple Gradebook',
    gradeBand: 'Teacher',
    category: 'Teacher',
    description: 'Track assignment scores and quick averages.',
    sampleData: [
      ['Student', 'Quiz 1', 'Project', 'Participation', 'Average'],
      ['A. Garcia', '88', '92', '100', '93.3'],
      ['J. Lee', '95', '90', '96', '93.7'],
      ['M. Patel', '78', '85', '90', '84.3'],
    ],
  },
  {
    id: 'attendance-tracker',
    title: 'Attendance Tracker',
    gradeBand: 'Teacher',
    category: 'Teacher',
    description: 'Track daily attendance patterns for a small group.',
    sampleData: [
      ['Student', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      ['A. Garcia', 'Present', 'Present', 'Present', 'Present', 'Present'],
      ['J. Lee', 'Present', 'Absent', 'Present', 'Present', 'Present'],
      ['M. Patel', 'Present', 'Present', 'Tardy', 'Present', 'Present'],
    ],
  },
];
