export type TemplateCategory = 'prose' | 'poetry' | 'academic' | 'other';

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  html: string;
}

export const templateCategoryLabels: Record<TemplateCategory, string> = {
  prose: 'Prose & Stories',
  poetry: 'Poetry',
  academic: 'Academic & Essays',
  other: 'Notes & Planning',
};

export const documentTemplates: DocumentTemplate[] = [
  {
    id: 'blank',
    title: 'Blank Document',
    description: 'Start from an empty page.',
    category: 'other',
    html: '<h1>Untitled Document</h1><p></p>',
  },
  // ── Prose & stories ────────────────────────────────────────────────
  {
    id: 'short-story',
    title: 'Short Story',
    description: 'Story arc: hook, rising action, climax, and resolution.',
    category: 'prose',
    html: `
      <h1>My Short Story</h1>
      <p><em>Once upon a time…</em></p>
      <h2>Beginning — the hook</h2>
      <p>Introduce the main character and the setting.</p>
      <h2>Rising action</h2>
      <p>What problem or goal appears? Build the tension.</p>
      <h2>Climax</h2>
      <p>The most exciting moment — the turning point.</p>
      <h2>Resolution</h2>
      <p>How does the problem get solved? How has the character changed?</p>
    `,
  },
  {
    id: 'personal-narrative',
    title: 'Personal Narrative',
    description: 'Tell a true story from your own life.',
    category: 'prose',
    html: `
      <h1>A Moment I Remember</h1>
      <p>Set the scene — where were you, and who was with you?</p>
      <p>What happened, step by step?</p>
      <p>How did you feel, and what did you learn?</p>
    `,
  },
  {
    id: 'descriptive-paragraph',
    title: 'Descriptive Paragraph',
    description: 'Paint a picture with sensory details.',
    category: 'prose',
    html: `
      <h1>Describe It</h1>
      <p><strong>What I see:</strong></p>
      <p><strong>What I hear:</strong></p>
      <p><strong>What I smell, taste, or touch:</strong></p>
      <p><strong>How it makes me feel:</strong></p>
    `,
  },
  {
    id: 'friendly-letter',
    title: 'Friendly Letter',
    description: 'Greeting, body, closing, and signature.',
    category: 'prose',
    html: `
      <p>Dear ______,</p>
      <p>How are you? I wanted to tell you about…</p>
      <p>Write your news and questions here.</p>
      <p>Your friend,</p>
      <p>______</p>
    `,
  },
  {
    id: 'journal-entry',
    title: 'Journal Entry',
    description: 'A dated reflection or diary entry.',
    category: 'prose',
    html: `
      <h1>Journal</h1>
      <p><em>Today's date:</em></p>
      <p>Today I…</p>
      <p>One thing I am thinking about is…</p>
      <p>Tomorrow I want to…</p>
    `,
  },
  // ── Poetry ─────────────────────────────────────────────────────────
  {
    id: 'poem-free-verse',
    title: 'Free Verse Poem',
    description: 'No rhyme or set rhythm — write from the heart.',
    category: 'poetry',
    html: `
      <h1>Free Verse</h1>
      <p>Line by line,</p>
      <p>break where a breath belongs,</p>
      <p>and let the words</p>
      <p>find their own shape.</p>
    `,
  },
  {
    id: 'poem-haiku',
    title: 'Haiku',
    description: 'Three lines: 5, 7, then 5 syllables.',
    category: 'poetry',
    html: `
      <h1>Haiku</h1>
      <p>Five syllables here <em>(5)</em></p>
      <p>Seven syllables follow <em>(7)</em></p>
      <p>Five to close it out <em>(5)</em></p>
    `,
  },
  {
    id: 'poem-acrostic',
    title: 'Acrostic Poem',
    description: 'Each line starts with a letter of your topic word.',
    category: 'poetry',
    html: `
      <h1>Acrostic</h1>
      <p><strong>W</strong> — </p>
      <p><strong>O</strong> — </p>
      <p><strong>R</strong> — </p>
      <p><strong>D</strong> — </p>
      <p><strong>S</strong> — </p>
    `,
  },
  {
    id: 'poem-cinquain',
    title: 'Cinquain',
    description: 'Five lines: 1 word, 2 words, 3 -ing words, a phrase, 1 word.',
    category: 'poetry',
    html: `
      <h1>Cinquain</h1>
      <p>Title <em>(one noun)</em></p>
      <p>Two describing words</p>
      <p>Three action -ing words</p>
      <p>A four-word feeling phrase</p>
      <p>Another word for the title</p>
    `,
  },
  {
    id: 'poem-diamante',
    title: 'Diamante',
    description: 'A diamond-shaped poem contrasting two ideas.',
    category: 'poetry',
    html: `
      <h1>Diamante</h1>
      <p>Noun</p>
      <p>Adjective, Adjective</p>
      <p>-ing, -ing, -ing</p>
      <p>Noun, Noun, Noun, Noun</p>
      <p>-ing, -ing, -ing</p>
      <p>Adjective, Adjective</p>
      <p>Opposite Noun</p>
    `,
  },
  {
    id: 'poem-limerick',
    title: 'Limerick',
    description: 'A funny five-line poem with an AABBA rhyme.',
    category: 'poetry',
    html: `
      <h1>Limerick</h1>
      <p>There once was a ______ from ______ <em>(A)</em></p>
      <p>Who ______________________ <em>(A)</em></p>
      <p>They ____________ <em>(B)</em></p>
      <p>And ____________ <em>(B)</em></p>
      <p>Till ______________________ <em>(A)</em></p>
    `,
  },
  {
    id: 'poem-sonnet',
    title: 'Sonnet',
    description: '14 lines of iambic-ish rhythm — three quatrains and a couplet.',
    category: 'poetry',
    html: `
      <h1>Sonnet</h1>
      <p>Quatrain 1 — line 1 (a)</p>
      <p>line 2 (b) · line 3 (a) · line 4 (b)</p>
      <p>Quatrain 2 — line 5 (c)</p>
      <p>line 6 (d) · line 7 (c) · line 8 (d)</p>
      <p>Quatrain 3 — line 9 (e)</p>
      <p>line 10 (f) · line 11 (e) · line 12 (f)</p>
      <p>Couplet — line 13 (g) · line 14 (g)</p>
    `,
  },
  {
    id: 'poem-ode',
    title: 'Ode',
    description: 'A poem that celebrates a person, place, or thing.',
    category: 'poetry',
    html: `
      <h1>Ode to ______</h1>
      <p>Oh, ______, how you…</p>
      <p>Describe why it matters to you.</p>
      <p>Praise it with your best images and feelings.</p>
    `,
  },
  // ── Project starters (newsletters, cards, certificates, etc.) ──────
  {
    id: 'newsletter',
    title: 'Class Newsletter',
    description: 'Masthead, headline stories, and announcements.',
    category: 'other',
    html: `
      <h1>Room ___ News</h1>
      <p><em>Volume 1 · This Week</em></p>
      <hr>
      <h2>Top Story</h2>
      <p>Write the biggest news of the week here.</p>
      <h2>What We're Learning</h2>
      <ul><li>Reading:</li><li>Math:</li><li>Science:</li></ul>
      <h2>Announcements</h2>
      <p>Reminders and important dates.</p>
    `,
  },
  {
    id: 'flyer',
    title: 'Event Flyer',
    description: 'A bold flyer to announce an event.',
    category: 'other',
    html: `
      <h1 style="text-align:center">Big Event!</h1>
      <p style="text-align:center"><strong>What:</strong> ______</p>
      <p style="text-align:center"><strong>When:</strong> ______</p>
      <p style="text-align:center"><strong>Where:</strong> ______</p>
      <p style="text-align:center">Add a picture and the details everyone needs to know.</p>
    `,
  },
  {
    id: 'certificate',
    title: 'Certificate',
    description: 'An award certificate to fill in and print.',
    category: 'other',
    html: `
      <h1 style="text-align:center">Certificate of Achievement</h1>
      <p style="text-align:center">This certificate is proudly presented to</p>
      <h2 style="text-align:center">______________________</h2>
      <p style="text-align:center">for</p>
      <p style="text-align:center"><em>outstanding ______________________</em></p>
      <p style="text-align:center">Date: __________ · Signed: __________</p>
    `,
  },
  {
    id: 'greeting-card',
    title: 'Greeting Card',
    description: 'A folded-style card front and inside message.',
    category: 'other',
    html: `
      <h1 style="text-align:center">Happy ______!</h1>
      <p style="text-align:center">(front of the card — add a picture)</p>
      <hr>
      <p>Dear ______,</p>
      <p>Write your warm message here.</p>
      <p>From, ______</p>
    `,
  },
  {
    id: 'report',
    title: 'Simple Report',
    description: 'Title, introduction, sections, and a conclusion.',
    category: 'academic',
    html: `
      <h1>Report Title</h1>
      <h2>Introduction</h2>
      <p>Tell the reader what this report is about.</p>
      <h2>Main Idea 1</h2>
      <p>Facts and details.</p>
      <h2>Main Idea 2</h2>
      <p>Facts and details.</p>
      <h2>Conclusion</h2>
      <p>Sum up what you learned.</p>
    `,
  },
];

const legacyTemplatesRaw: Array<Omit<DocumentTemplate, 'category'>> = [
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

const legacyCategories: Record<string, TemplateCategory> = {
  'five-paragraph-essay': 'academic',
  'lab-report': 'academic',
  'cornell-notes': 'other',
  'persuasive-essay': 'academic',
  storyboard: 'other',
  'book-report': 'academic',
  'research-paper': 'academic',
};

legacyTemplatesRaw.forEach((template) => {
  documentTemplates.push({ ...template, category: legacyCategories[template.id] ?? 'other' });
});
