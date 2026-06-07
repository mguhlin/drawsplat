import type { SheetMatrix } from '../io/matrix';

export interface Activity {
  id: string;
  title: string;
  gradeBand: string;
  teks: string[];
  instructions: string;
  teacherNotes: string;
  sampleData: SheetMatrix;
}

export const activities: Activity[] = [
  {
    id: 'favorite-fruit-pictograph',
    title: 'Favorite Fruit Pictograph',
    gradeBand: 'Grade 3',
    teks: ['3.8A', '3.8B'],
    instructions:
      'Survey classmates, count favorite fruits, and compare totals.',
    teacherNotes:
      'Discuss how the same data can become a table, pictograph, or bar chart.',
    sampleData: [
      ['Fruit', 'Count'],
      ['Apples', '6'],
      ['Bananas', '4'],
      ['Oranges', '5'],
    ],
  },
  {
    id: 'class-pet-survey',
    title: 'Class Pet Survey Bar Graph',
    gradeBand: 'Grades 3-4',
    teks: ['3.8A', '3.8B'],
    instructions: 'Use survey results to make and explain a bar chart.',
    teacherNotes:
      'Ask students which pet category has the most and how many more.',
    sampleData: [
      ['Pet', 'Votes'],
      ['Dog', '8'],
      ['Cat', '6'],
      ['Fish', '3'],
      ['No pet', '5'],
    ],
  },
  {
    id: 'daily-temperature',
    title: 'Daily Temperature Line Graph',
    gradeBand: 'Grades 3-5',
    teks: ['3.8A'],
    instructions:
      'Track daily temperature and look for changes across the week.',
    teacherNotes: 'Connect graph patterns to weather observations.',
    sampleData: [
      ['Day', 'Temperature'],
      ['Monday', '72'],
      ['Tuesday', '75'],
      ['Wednesday', '73'],
      ['Thursday', '78'],
      ['Friday', '80'],
    ],
  },
  {
    id: 'plant-growth',
    title: 'Plant Growth Over Two Weeks',
    gradeBand: 'Grades 3-5',
    teks: ['3.8A'],
    instructions: 'Measure plant height and chart growth over time.',
    teacherNotes:
      'Discuss fair measurement and why repeated observations matter.',
    sampleData: [
      ['Day', 'Height cm'],
      ['1', '4'],
      ['4', '5'],
      ['7', '7'],
      ['10', '9'],
      ['14', '12'],
    ],
  },
  {
    id: 'lunch-count',
    title: 'Lunch Count Tally to Bar Chart',
    gradeBand: 'Grade 3',
    teks: ['3.8A', '3.8B'],
    instructions:
      'Turn lunch choices into a chart and answer comparison questions.',
    teacherNotes:
      'Use the activity to connect tally marks, tables, and charts.',
    sampleData: [
      ['Lunch', 'Count'],
      ['Pizza', '10'],
      ['Tacos', '7'],
      ['Salad', '4'],
      ['Sandwich', '6'],
    ],
  },
  {
    id: 'rolling-dice',
    title: 'Rolling Dice Probability',
    gradeBand: 'Grades 4-5',
    teks: ['4.9A', '4.9B'],
    instructions: 'Record dice roll totals and look for common outcomes.',
    teacherNotes: 'Discuss why more trials can make patterns easier to see.',
    sampleData: [
      ['Total', 'Rolls'],
      ['2', '1'],
      ['3', '2'],
      ['4', '4'],
      ['5', '5'],
      ['6', '7'],
      ['7', '8'],
    ],
  },
  {
    id: 'recycling-sort',
    title: 'Recycling Sort Pictograph',
    gradeBand: 'Grades 3-5',
    teks: ['3.8A'],
    instructions: 'Sort classroom recycling and make a picture graph.',
    teacherNotes: 'Connect data collection to classroom science conversations.',
    sampleData: [
      ['Material', 'Items'],
      ['Paper', '12'],
      ['Plastic', '8'],
      ['Metal', '3'],
      ['Cardboard', '6'],
    ],
  },
];

export const projectIdeas = [
  'Track the weather for a week and make a graph.',
  'Survey the class and present what you found.',
  'Measure plant growth and compare changes over time.',
  'Collect recycling data and explain what your class uses most.',
];
