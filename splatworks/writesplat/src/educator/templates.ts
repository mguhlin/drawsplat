export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  html: string;
}

export const documentTemplates: DocumentTemplate[] = [
  {
    id: 'five-paragraph-essay',
    title: 'Five-Paragraph Essay',
    description: 'Introduction, three body paragraphs, and conclusion.',
    html: `
      <h1>Five-Paragraph Essay</h1>
      <h2>Introduction</h2>
      <p>Hook:</p>
      <p>Background:</p>
      <p>Thesis:</p>
      <h2>Body Paragraph 1</h2>
      <p>Topic sentence:</p>
      <p>Evidence:</p>
      <p>Explanation:</p>
      <h2>Body Paragraph 2</h2>
      <p>Topic sentence:</p>
      <p>Evidence:</p>
      <p>Explanation:</p>
      <h2>Body Paragraph 3</h2>
      <p>Topic sentence:</p>
      <p>Evidence:</p>
      <p>Explanation:</p>
      <h2>Conclusion</h2>
      <p>Restate the thesis and leave the reader with a final thought.</p>
    `,
  },
  {
    id: 'lab-report',
    title: 'Lab Report',
    description: 'Question, hypothesis, materials, procedure, data, and conclusion.',
    html: `
      <h1>Lab Report</h1>
      <h2>Question</h2>
      <p>What are we investigating?</p>
      <h2>Hypothesis</h2>
      <p>If ..., then ... because ...</p>
      <h2>Materials</h2>
      <ul><li>Material 1</li><li>Material 2</li></ul>
      <h2>Procedure</h2>
      <ol><li>First step</li><li>Second step</li></ol>
      <h2>Data and Observations</h2>
      <p>Record measurements and observations here.</p>
      <h2>Conclusion</h2>
      <p>Use evidence to explain what happened.</p>
    `,
  },
  {
    id: 'cornell-notes',
    title: 'Cornell Notes',
    description: 'Cue column, notes, and summary.',
    html: `
      <h1>Cornell Notes</h1>
      <h2>Topic</h2>
      <p>Write the lesson or reading topic here.</p>
      <h2>Cues and Questions</h2>
      <ul><li>Key question:</li><li>Vocabulary:</li></ul>
      <h2>Notes</h2>
      <p>Main ideas and details go here.</p>
      <h2>Summary</h2>
      <p>Summarize the most important ideas in three to five sentences.</p>
    `,
  },
  {
    id: 'persuasive-essay',
    title: 'Persuasive Essay',
    description: 'Claim, evidence, warrant, counterclaim, and conclusion.',
    html: `
      <h1>Persuasive Essay</h1>
      <h2>Claim</h2>
      <p>I believe...</p>
      <h2>Reason 1</h2>
      <p>Evidence:</p>
      <p>Warrant:</p>
      <h2>Reason 2</h2>
      <p>Evidence:</p>
      <p>Warrant:</p>
      <h2>Counterclaim</h2>
      <p>Some people may say...</p>
      <h2>Conclusion</h2>
      <p>Restate your claim and call the reader to think or act.</p>
    `,
  },
  {
    id: 'storyboard',
    title: 'Storyboard',
    description: 'Scene-by-scene planning with visual notes and captions.',
    html: `
      <h1>Storyboard</h1>
      <h2>Scene 1</h2>
      <p>Visual notes:</p>
      <p>Caption or narration:</p>
      <h2>Scene 2</h2>
      <p>Visual notes:</p>
      <p>Caption or narration:</p>
      <h2>Scene 3</h2>
      <p>Visual notes:</p>
      <p>Caption or narration:</p>
    `,
  },
  {
    id: 'book-report',
    title: 'Book Report',
    description: 'Book details, characters, setting, summary, and response.',
    html: `
      <h1>Book Report</h1>
      <h2>Book Details</h2>
      <p>Title:</p>
      <p>Author:</p>
      <h2>Characters</h2>
      <p>Who is important in the story?</p>
      <h2>Setting</h2>
      <p>Where and when does the story happen?</p>
      <h2>Summary</h2>
      <p>Explain the beginning, middle, and end.</p>
      <h2>Response</h2>
      <p>What did you think, and what evidence supports your opinion?</p>
    `,
  },
  {
    id: 'research-paper',
    title: 'Research Paper',
    description: 'Question, thesis, evidence sections, and citations.',
    html: `
      <h1>Research Paper</h1>
      <h2>Research Question</h2>
      <p>What question will this paper answer?</p>
      <h2>Thesis</h2>
      <p>This paper argues...</p>
      <h2>Evidence Section 1</h2>
      <p>Source and notes:</p>
      <h2>Evidence Section 2</h2>
      <p>Source and notes:</p>
      <h2>Conclusion</h2>
      <p>What should the reader understand now?</p>
      <h2>Citations</h2>
      <p>Add citations here.</p>
    `,
  },
];
