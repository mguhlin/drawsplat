import { countDocumentStats } from './app/stats';
import { analyzeWritingWarnings, type WritingWarnings } from './analysis/detectors';
import { analyzeReadability } from './analysis/scorer';
import { parseVocabularyTerms } from './analysis/vocabulary';
import { createWriterEditor, type EditorCommand } from './editor/writerEditor';
import { formatCitation, type CitationStyle } from './educator/citations';
import { pauseReadAloud, readTextAloud, stopReadAloud } from './educator/readAloud';
import { scrambleParagraphs, scrambleSentences } from './educator/scrambler';
import { documentTemplates, templateCategoryLabels } from './educator/templates';
import { emojiCategories, emojiForShortcode, searchEmojis } from './educator/emojis';
import { createStudentClozeHtml, createTeacherClozeHtml } from './export/cloze';
import { htmlToDocxBlob } from './export/docx';
import { createStandaloneHtml } from './export/html';
import { htmlToMarkdown, markdownToHtml } from './export/markdown';
import { htmlToOdtBlob } from './export/odt';
import { htmlToPlainText } from './export/plainText';
import { htmlToRtf } from './export/rtf';
import { createStudentViewHtml, createTeacherViewHtml } from './export/studentView';
import { assertWriteSplatFile, createNativeFile, type WriteSplatFile } from './storage/nativeFile';
import { docxToHtml } from './storage/importDocx';
import './styles/global.css';

const AUTOSAVE_KEY = 'writesplat.autosave.v1';
const LIBRARY_INDEX_KEY = 'writesplat.documents.index.v1';
const LIBRARY_ITEM_PREFIX = 'writesplat.documents.v1.';
const LANGUAGE_KEY = 'drawsplat.language';
const READ_ALOUD_VOICE_KEY = 'writesplat.readaloud.voice';
const READ_ALOUD_RATE_KEY = 'writesplat.readaloud.rate';
const ANALYSIS_DEBOUNCE_MS = 300;

interface LibraryEntry {
  id: string;
  title: string;
  updatedAt: string;
}

const starterBody = `
  <h1>Untitled Document</h1>
  <p>Start writing in WriteSplatTM. Your work saves locally and the readability panel updates as you type.</p>
`;

type IconName =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'heading'
  | 'paragraph'
  | 'quote'
  | 'code'
  | 'list'
  | 'listOrdered'
  | 'link'
  | 'image'
  | 'table'
  | 'horizontalRule'
  | 'pageBreak'
  | 'undo'
  | 'redo'
  | 'save'
  | 'open'
  | 'panel'
  | 'template'
  | 'cloze'
  | 'citation'
  | 'student'
  | 'teacher'
  | 'play'
  | 'stop'
  | 'scramble'
  | 'vocabulary'
  | 'emoji'
  | 'cloud';

type MenuAction = [action: string, text: string];
type MenuSubmenu = {
  label: string;
  items: MenuAction[];
};
type MenuItem = MenuAction | MenuSubmenu;
type LanguageCode = 'en' | 'es' | 'vi' | 'ar' | 'zh' | 'uh';
type MarkdownMode = 'wysiwyg' | 'raw' | 'split';

const languages: Array<{ code: LanguageCode; label: string; dir: 'ltr' | 'rtl'; htmlLang: string }> = [
  { code: 'en', label: 'English', dir: 'ltr', htmlLang: 'en' },
  { code: 'es', label: 'Español', dir: 'ltr', htmlLang: 'es' },
  { code: 'vi', label: 'Tiếng Việt', dir: 'ltr', htmlLang: 'vi' },
  { code: 'ar', label: 'العربية', dir: 'rtl', htmlLang: 'ar' },
  { code: 'zh', label: '中文', dir: 'ltr', htmlLang: 'zh' },
  { code: 'uh', label: 'हिन्दी / اردو', dir: 'ltr', htmlLang: 'hi' },
];

const translations: Record<Exclude<LanguageCode, 'en'>, Record<string, string>> = {
  es: {
    New: 'Nuevo',
    'Save Local': 'Guardar local',
    Library: 'Biblioteca',
    'Save JSON': 'Guardar JSON',
    'Open JSON': 'Abrir JSON',
    File: 'Archivo',
    Edit: 'Editar',
    Insert: 'Insertar',
    Format: 'Formato',
    Tools: 'Herramientas',
    View: 'Vista',
    Teacher: 'Docente',
    Help: 'Ayuda',
    'Export As': 'Exportar como',
    'New document': 'Documento nuevo',
    'Save to browser': 'Guardar en navegador',
    'Open browser library': 'Abrir biblioteca',
    'Save .writesplat.json': 'Guardar .writesplat.json',
    'Open .writesplat.json': 'Abrir .writesplat.json',
    Print: 'Imprimir',
    'Find and replace': 'Buscar y reemplazar',
    Link: 'Enlace',
    Image: 'Imagen',
    Table: 'Tabla',
    'Insert table': 'Insertar tabla',
    'Horizontal rule': 'Línea horizontal',
    'Page break': 'Salto de página',
    Bold: 'Negrita',
    Italic: 'Cursiva',
    Underline: 'Subrayado',
    Strikethrough: 'Tachado',
    'Toggle analysis': 'Alternar análisis',
    'Read aloud': 'Leer en voz alta',
    'Pause read-aloud': 'Pausar lectura',
    'Stop read-aloud': 'Detener lectura',
    'Toggle sidebar': 'Alternar panel',
    'Toggle theme': 'Alternar tema',
    Templates: 'Plantillas',
    'Cloze Builder': 'Constructor cloze',
    'Citation assistant': 'Asistente de citas',
    'Student View': 'Vista estudiante',
    'Teacher Notes': 'Notas docentes',
    Scrambler: 'Mezclador',
    'Insert answer key': 'Insertar clave',
    'Vocabulary highlighter': 'Resaltador de vocabulario',
    Title: 'Título',
    Author: 'Autor',
    Optional: 'Opcional',
    'Saved locally': 'Guardado localmente',
    Readability: 'Legibilidad',
    Stats: 'Estadísticas',
    Suggestions: 'Sugerencias',
    Words: 'Palabras',
    Sentences: 'Oraciones',
    Paragraphs: 'Párrafos',
    'Target grade': 'Grado objetivo',
    'Teacher Tools': 'Herramientas docentes',
  },
  vi: {
    New: 'Mới',
    'Save Local': 'Lưu cục bộ',
    Library: 'Thư viện',
    File: 'Tệp',
    Edit: 'Sửa',
    Insert: 'Chèn',
    Format: 'Định dạng',
    Tools: 'Công cụ',
    View: 'Xem',
    Teacher: 'Giáo viên',
    Help: 'Trợ giúp',
    'Export As': 'Xuất dạng',
    Print: 'In',
    Templates: 'Mẫu',
    'Citation assistant': 'Trợ lý trích dẫn',
    'Student View': 'Chế độ học sinh',
    Title: 'Tiêu đề',
    Author: 'Tác giả',
    Readability: 'Độ dễ đọc',
    Stats: 'Thống kê',
    Suggestions: 'Gợi ý',
    Words: 'Từ',
    Sentences: 'Câu',
    Paragraphs: 'Đoạn',
  },
  ar: {
    New: 'جديد',
    'Save Local': 'حفظ محلي',
    Library: 'المكتبة',
    File: 'ملف',
    Edit: 'تحرير',
    Insert: 'إدراج',
    Format: 'تنسيق',
    Tools: 'أدوات',
    View: 'عرض',
    Teacher: 'المعلم',
    Help: 'مساعدة',
    'Export As': 'تصدير باسم',
    Print: 'طباعة',
    Templates: 'قوالب',
    'Citation assistant': 'مساعد الاقتباس',
    'Student View': 'عرض الطالب',
    Title: 'العنوان',
    Author: 'المؤلف',
    Readability: 'سهولة القراءة',
    Stats: 'الإحصاءات',
    Suggestions: 'اقتراحات',
    Words: 'الكلمات',
    Sentences: 'الجمل',
    Paragraphs: 'الفقرات',
  },
  zh: {
    New: '新建',
    'Save Local': '本地保存',
    Library: '资料库',
    File: '文件',
    Edit: '编辑',
    Insert: '插入',
    Format: '格式',
    Tools: '工具',
    View: '视图',
    Teacher: '教师',
    Help: '帮助',
    'Export As': '导出为',
    Print: '打印',
    Templates: '模板',
    'Citation assistant': '引用助手',
    'Student View': '学生视图',
    Title: '标题',
    Author: '作者',
    Readability: '可读性',
    Stats: '统计',
    Suggestions: '建议',
    Words: '词数',
    Sentences: '句子',
    Paragraphs: '段落',
  },
  uh: {
    New: 'नया',
    'Save Local': 'स्थानीय सहेजें',
    Library: 'लाइब्रेरी',
    File: 'फ़ाइल',
    Edit: 'संपादित करें',
    Insert: 'सम्मिलित करें',
    Format: 'फ़ॉर्मैट',
    Tools: 'उपकरण',
    View: 'दृश्य',
    Teacher: 'शिक्षक',
    Help: 'मदद',
    'Export As': 'इस रूप में निर्यात',
    Print: 'प्रिंट',
    Templates: 'टेम्पलेट',
    'Citation assistant': 'उद्धरण सहायक',
    'Student View': 'छात्र दृश्य',
    Title: 'शीर्षक',
    Author: 'लेखक',
    Readability: 'पठनीयता',
    Stats: 'आँकड़े',
    Suggestions: 'सुझाव',
    Words: 'शब्द',
    Sentences: 'वाक्य',
    Paragraphs: 'अनुच्छेद',
  },
};

const originalTextNodes = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Record<string, string>>();

function icon(name: IconName): string {
  const paths: Record<IconName, string> = {
    bold: '<path d="M7 5h6.5a3.2 3.2 0 0 1 0 6.4H7z"/><path d="M7 11.4h7.2a3.3 3.3 0 0 1 0 6.6H7z"/>',
    italic: '<path d="M11 5h7"/><path d="M6 19h7"/><path d="m14 5-4 14"/>',
    underline: '<path d="M7 5v6a5 5 0 0 0 10 0V5"/><path d="M5 21h14"/>',
    strike: '<path d="M6 12h12"/><path d="M16 6.5A5 5 0 0 0 12.2 5C9.9 5 8 6.2 8 8c0 3.8 8 2.2 8 7 0 2-1.9 4-4.7 4A6.5 6.5 0 0 1 6 16.7"/>',
    heading: '<path d="M6 5v14"/><path d="M18 5v14"/><path d="M6 12h12"/><path d="M14 19h6"/>',
    paragraph: '<path d="M13 5h-2.5a4.5 4.5 0 0 0 0 9H13"/><path d="M13 5v14"/><path d="M17 5v14"/>',
    quote: '<path d="M8 11h4v7H5v-5a6 6 0 0 1 6-6"/><path d="M19 11h-4v7h7v-5a6 6 0 0 0-6-6"/>',
    code: '<path d="m9 18-6-6 6-6"/><path d="m15 6 6 6-6 6"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    listOrdered: '<path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M4 14h2a1 1 0 0 1 0 2H4l2 2H4"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="10" r="2"/><path d="m21 16-5-5L5 19"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M9 4v16"/><path d="M15 4v16"/>',
    horizontalRule: '<path d="M4 12h16"/><path d="M7 7h10"/><path d="M7 17h10"/>',
    pageBreak: '<path d="M6 3h9l3 3v5"/><path d="M15 3v4h4"/><path d="M6 21h12"/><path d="M4 14h16"/><path d="M7 17h10"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h2"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
    open: '<path d="M4 20h16"/><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/>',
    panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/><path d="M7 9h4"/><path d="M7 13h4"/>',
    template: '<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/><path d="M9 12h6"/><path d="M9 16h6"/>',
    cloze: '<path d="M4 17h16"/><path d="M7 9h10"/><path d="M7 13h7"/><path d="M4 21h16"/>',
    citation: '<path d="M6 4h12v16H6z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h3"/>',
    student: '<path d="M12 4 3 9l9 5 9-5z"/><path d="M6 11v4c2 3 10 3 12 0v-4"/>',
    teacher: '<path d="M4 19V7a2 2 0 0 1 2-2h13v14H6a2 2 0 0 0-2 2"/><path d="M8 9h7"/><path d="M8 13h5"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    scramble: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>',
    vocabulary: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3Z"/><path d="M9 8h6"/><path d="M9 12h4"/>',
    emoji: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
    cloud: '<path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.5 2A4 4 0 0 0 6 19z"/>',
  };

  return `<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}

function iconButton(commandOrAction: 'command' | 'action', name: string, label: string, iconName: IconName): string {
  return `<button class="icon-button" ${commandOrAction === 'command' ? 'data-command' : 'data-action'}="${name}" aria-label="${label}" title="${label}">${icon(iconName)}<span class="sr-only">${label}</span></button>`;
}

function toolButton(action: string, label: string, iconName: IconName): string {
  return `<button class="tool-card" type="button" data-action="${action}">${icon(iconName)}<span>${label}</span></button>`;
}

function targetGradeOptions(): string {
  const grades = [
    ['0', 'K'],
    ...Array.from({ length: 12 }, (_, index) => [String(index + 1), String(index + 1)]),
    ['13', 'College'],
  ];

  return grades.map(([value, label]) => `<option value="${value}"${value === '6' ? ' selected' : ''}>${label}</option>`).join('');
}

function fontFamilyOptions(): string {
  return [
    ['', 'System'],
    ['Arial, Helvetica, sans-serif', 'Arial'],
    ['Georgia, serif', 'Georgia'],
    ['"Times New Roman", Times, serif', 'Times'],
    ['"Courier New", ui-monospace, monospace', 'Courier'],
  ]
    .map(([value, label]) => `<option value="${escapeHtml(value)}">${label}</option>`)
    .join('');
}

function blockStyleOptions(): string {
  return [
    ['paragraph', 'Body'],
    ['heading1', 'Heading 1'],
    ['heading2', 'Heading 2'],
    ['heading3', 'Heading 3'],
    ['heading4', 'Heading 4'],
    ['heading5', 'Heading 5'],
    ['heading6', 'Heading 6'],
    ['blockquote', 'Quote'],
    ['codeBlock', 'Code'],
  ]
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');
}

function fontSizeOptions(): string {
  return [
    ['', 'Size'],
    ['12px', '12'],
    ['14px', '14'],
    ['16px', '16'],
    ['18px', '18'],
    ['24px', '24'],
    ['32px', '32'],
  ]
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');
}

function textColorOptions(): string {
  return [
    ['', 'Text'],
    ['#1f2937', 'Ink'],
    ['#5b21b6', 'Purple'],
    ['#b91c1c', 'Red'],
    ['#166534', 'Green'],
    ['#1d4ed8', 'Blue'],
  ]
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');
}

function highlightColorOptions(): string {
  return [
    ['', 'Highlight'],
    ['#fef3c7', 'Yellow'],
    ['#dcfce7', 'Green'],
    ['#dbeafe', 'Blue'],
    ['#f3e8ff', 'Purple'],
    ['#fee2e2', 'Red'],
  ]
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');
}

function alignmentOptions(): string {
  return [
    ['', 'Align'],
    ['left', 'Left'],
    ['center', 'Center'],
    ['right', 'Right'],
    ['justify', 'Justify'],
  ]
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');
}

function zoomOptions(): string {
  return [
    ['0.85', '85%'],
    ['1', '100%'],
    ['1.15', '115%'],
    ['1.3', '130%'],
  ]
    .map(([value, label]) => `<option value="${value}"${value === '1' ? ' selected' : ''}>${label}</option>`)
    .join('');
}

function languageOptions(current: LanguageCode): string {
  return languages
    .map(({ code, label }) => `<option value="${code}"${code === current ? ' selected' : ''}>${label}</option>`)
    .join('');
}

function normalizeLanguage(value: string | null | undefined): LanguageCode {
  const lang = (value || '').toLowerCase();
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('vi')) return 'vi';
  if (lang.startsWith('ar')) return 'ar';
  if (lang.startsWith('zh')) return 'zh';
  if (lang === 'uh' || lang.startsWith('ur') || lang.startsWith('hi')) return 'uh';
  return 'en';
}

function initialLanguage(): LanguageCode {
  const params = new URLSearchParams(window.location.search);
  try {
    return normalizeLanguage(params.get('lang') || localStorage.getItem(LANGUAGE_KEY) || navigator.language);
  } catch {
    return normalizeLanguage(params.get('lang') || navigator.language);
  }
}

function chooseFriendlyVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const preferredNames = ['google', 'microsoft', 'natural', 'samantha', 'jenny', 'aria', 'zira', 'ava', 'susan', 'karen'];
  return (
    voices.find((voice) => preferredNames.some((name) => voice.name.toLowerCase().includes(name))) ??
    voices.find((voice) => voice.localService) ??
    voices[0] ??
    null
  );
}

function translateText(value: string, language: LanguageCode): string {
  if (language === 'en') return value;
  return translations[language][value] ?? value;
}

function applyLanguage(root: HTMLElement, language: LanguageCode): void {
  const config = languages.find((item) => item.code === language) ?? languages[0];
  document.documentElement.lang = config.htmlLang;
  document.documentElement.dir = config.dir;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (
        !parent ||
        parent.closest('.editor') ||
        parent.closest('script, style, svg, textarea') ||
        parent.tagName === 'INPUT'
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  let node = walker.nextNode() as Text | null;
  while (node) {
    const original = originalTextNodes.get(node) ?? node.nodeValue ?? '';
    originalTextNodes.set(node, original);
    const trimmed = original.trim();
    const translated = translateText(trimmed, language);
    node.nodeValue = original.replace(trimmed, translated);
    node = walker.nextNode() as Text | null;
  }

  root.querySelectorAll<HTMLElement>('[aria-label], [title], [placeholder]').forEach((element) => {
    const originals = originalAttributes.get(element) ?? {};
    ['aria-label', 'title', 'placeholder'].forEach((attribute) => {
      const current = element.getAttribute(attribute);
      if (!current) return;
      if (!originals[attribute]) {
        originals[attribute] = current;
      }
      element.setAttribute(attribute, translateText(originals[attribute], language));
    });
    originalAttributes.set(element, originals);
  });
}

function appHtml(): string {
  const language = initialLanguage();

  return `
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="writesplat_icon.png" alt="" aria-hidden="true">
        <span><strong>WriteSplat<sup>TM</sup></strong><small>SplatWorks<sup>TM</sup> Writing Studio</small></span>
      </a>
      <div class="quick-actions">
        <button class="primary" data-action="new-document">New</button>
        <button data-action="save-local-document">Save Local</button>
        <button data-action="open-local-library">Library</button>
        <button data-action="save-json">Save JSON</button>
        <button data-action="open-json">Open JSON</button>
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${languageOptions(language)}</select>
      </div>
    </header>

    <main class="write-app">
      <nav class="menu-bar" aria-label="WriteSplat menus">
        ${menu('File', [
          ['new-document', 'New document'],
          ['save-local-document', 'Save to browser'],
          ['open-local-library', 'Open browser library'],
          ['save-json', 'Save .writesplat.json'],
          ['open-json', 'Open .writesplat.json'],
          ['import-file', 'Import (.md, .html, .txt, .docx)'],
          {
            label: 'Export As',
            items: [
              ['open-export-dialog', 'Export options'],
              ['export-text', 'Plain text (.txt)'],
              ['export-markdown', 'Markdown (.md)'],
              ['export-html', 'HTML (.html)'],
              ['export-rtf', 'RTF (.rtf)'],
              ['export-docx', 'Word (.docx)'],
              ['export-odt', 'OpenDocument (.odt)'],
              ['export-student-cloze', 'Student cloze HTML'],
              ['export-teacher-cloze', 'Teacher cloze HTML'],
              ['export-student-view', 'Student View HTML'],
              ['export-teacher-view', 'Teacher View HTML'],
            ],
          },
          ['print', 'Print'],
        ])}
        ${menu('Edit', [
          ['undo', 'Undo'],
          ['redo', 'Redo'],
          ['open-find-dialog', 'Find and replace'],
        ])}
        ${menu('Insert', [
          ['open-link-dialog', 'Link'],
          ['remove-link', 'Remove link'],
          ['open-image-dialog', 'Image'],
          ['open-emoji-dialog', 'Emoji…'],
          {
            label: 'Table',
            items: [
              ['insertTable', 'Insert table'],
              ['addTableRow', 'Add row'],
              ['addTableColumn', 'Add column'],
              ['deleteTableRow', 'Delete row'],
              ['deleteTableColumn', 'Delete column'],
              ['mergeTableCells', 'Merge cells'],
              ['splitTableCell', 'Split cell'],
              ['deleteTable', 'Delete table'],
            ],
          },
          ['insertHorizontalRule', 'Horizontal rule'],
          ['insertPageBreak', 'Page break'],
        ])}
        ${menu('Format', [
          ['bold', 'Bold'],
          ['italic', 'Italic'],
          ['underline', 'Underline'],
          ['strike', 'Strikethrough'],
          ['heading1', 'Heading 1'],
          ['heading2', 'Heading 2'],
          ['heading3', 'Heading 3'],
          ['heading4', 'Heading 4'],
          ['heading5', 'Heading 5'],
          ['heading6', 'Heading 6'],
          ['paragraph', 'Body text'],
          ['blockquote', 'Blockquote'],
          ['codeBlock', 'Code block'],
        ])}
        ${menu('Tools', [
          ['toggleAnalysis', 'Toggle analysis'],
          ['read-aloud', 'Read aloud'],
          ['pause-read-aloud', 'Pause read-aloud'],
          ['stop-read-aloud', 'Stop read-aloud'],
        ])}
        ${menu('View', [
          ['toggle-sidebar', 'Toggle sidebar'],
          ['toggle-theme', 'Toggle theme'],
          {
            label: 'Markdown mode',
            items: [
              ['markdown-wysiwyg', 'WYSIWYG editor'],
              ['markdown-raw', 'Raw Markdown'],
              ['markdown-split', 'Split Markdown'],
            ],
          },
        ])}
        <span class="menu-spacer"></span>
        ${menu('Teacher', [
          ['open-template-dialog', 'Templates'],
          {
            label: 'Cloze Builder',
            items: [
              ['mark-cloze', 'Convert selection to blank'],
              ['remove-cloze', 'Remove cloze mark'],
              ['export-student-cloze', 'Export student cloze HTML'],
              ['export-teacher-cloze', 'Export teacher cloze HTML'],
            ],
          },
          ['open-citation-dialog', 'Citation assistant'],
          ['insert-citations-section', 'Insert citations section'],
          ['toggle-student-view', 'Toggle Student View'],
          {
            label: 'Teacher Notes',
            items: [
              ['mark-teacher-only', 'Mark teacher only'],
              ['remove-teacher-only', 'Remove teacher-only mark'],
              ['export-student-view', 'Export Student View HTML'],
              ['export-teacher-view', 'Export Teacher View HTML'],
            ],
          },
          {
            label: 'Scrambler',
            items: [
              ['scramble-sentences', 'Scramble selected sentences'],
              ['scramble-paragraphs', 'Scramble selected paragraphs'],
            ],
          },
          ['insert-answer-key', 'Insert answer key'],
          ['open-vocabulary-dialog', 'Vocabulary highlighter'],
        ], 'teacher-menu')}
        <details class="menu">
          <summary>Help</summary>
          <div class="menu-panel">
            <button data-action="open-help-dialog">WriteSplat help</button>
            <button data-action="open-shortcuts-dialog">Keyboard shortcuts</button>
            <button data-action="open-export-dialog">Save and export</button>
            <a href="../../pages/support.html" target="_blank" rel="noopener">Support hub</a>
            <a href="../../legal/terms-privacy.html" target="_blank" rel="noopener">Terms &amp; Privacy</a>
            <a href="../../legal/gdpr-compliance.html" target="_blank" rel="noopener">GDPR summary</a>
          </div>
        </details>
      </nav>

      <section class="toolbar" aria-label="Formatting toolbar">
        ${iconButton('command', 'bold', 'Bold', 'bold')}
        ${iconButton('command', 'italic', 'Italic', 'italic')}
        ${iconButton('command', 'underline', 'Underline', 'underline')}
        ${iconButton('command', 'strike', 'Strikethrough', 'strike')}
        <span class="divider"></span>
        ${iconButton('command', 'paragraph', 'Body text', 'paragraph')}
        ${iconButton('command', 'blockquote', 'Blockquote', 'quote')}
        ${iconButton('command', 'codeBlock', 'Code block', 'code')}
        ${iconButton('command', 'bulletList', 'Bulleted list', 'list')}
        ${iconButton('command', 'orderedList', 'Numbered list', 'listOrdered')}
        ${iconButton('action', 'open-link-dialog', 'Link', 'link')}
        ${iconButton('action', 'open-image-dialog', 'Image', 'image')}
        ${iconButton('action', 'open-emoji-dialog', 'Emoji', 'emoji')}
        ${iconButton('command', 'insertTable', 'Table', 'table')}
        ${iconButton('command', 'insertHorizontalRule', 'Horizontal rule', 'horizontalRule')}
        ${iconButton('command', 'insertPageBreak', 'Page break', 'pageBreak')}
        ${iconButton('command', 'undo', 'Undo', 'undo')}
        ${iconButton('command', 'redo', 'Redo', 'redo')}
        <span class="divider"></span>
        ${iconButton('action', 'toggle-sidebar', 'Toggle sidebar', 'panel')}
        ${iconButton('action', 'save-json', 'Save', 'save')}
        ${iconButton('action', 'open-json', 'Open', 'open')}
      </section>

      <section class="format-strip" aria-label="Text style controls">
        <label>Block Style <select id="blockStyleSelect">${blockStyleOptions()}</select></label>
        <label>Font <select id="fontFamilySelect">${fontFamilyOptions()}</select></label>
        <label>Size <select id="fontSizeSelect">${fontSizeOptions()}</select></label>
        <label>Color <select id="textColorSelect">${textColorOptions()}</select></label>
        <label>Highlight <select id="highlightColorSelect">${highlightColorOptions()}</select></label>
        <label>Align <select id="alignmentSelect">${alignmentOptions()}</select></label>
        <label>Zoom <select id="zoomSelect">${zoomOptions()}</select></label>
      </section>

      <section class="workspace">
        <section class="document-panel" aria-label="Document editor">
          <div class="document-meta">
            <label>Title <input id="docTitle" value="Untitled Document"></label>
            <label>Author <input id="docAuthor" placeholder="Optional"></label>
            <span id="saveState">Saved locally</span>
          </div>
          <div id="editor" class="editor" role="textbox" aria-multiline="true" aria-label="WriteSplat document editor"></div>
          <textarea id="markdownSource" class="markdown-source" aria-label="Raw Markdown source" spellcheck="false"></textarea>
        </section>

        <aside id="sidebar" class="sidebar" aria-label="Readability and educator tools">
          <section class="readability-card">
            <div class="readability-head">
              <div>
                <p class="eyebrow">Readability</p>
                <h2 id="readabilityGradeLabel">Grade 0</h2>
                <p id="readabilityStatus" class="readability-status">Start writing.</p>
              </div>
              <label class="target-grade-control" title="Target grade">
                <span class="sr-only">Target grade</span>
                <select id="targetGrade">${targetGradeOptions()}</select>
              </label>
            </div>
            <details class="readability-stats">
              <summary>Show more stats</summary>
              <div class="stats-grid">
                <div><span>Letters</span><strong id="letterCount">0</strong></div>
                <div><span>Characters</span><strong id="characterCount">0</strong></div>
                <div><span>Words</span><strong id="wordCount">0</strong></div>
                <div><span>Sentences</span><strong id="sentenceCount">0</strong></div>
                <div><span>Paragraphs</span><strong id="paragraphCount">0</strong></div>
                <div><span>Reading time</span><strong id="readingTime">0s</strong></div>
                <div><span>Reading ease</span><strong id="readingEase">0</strong></div>
                <div><span>Syllables</span><strong id="syllableCount">0</strong></div>
              </div>
            </details>
            <div class="suggestion-cards" aria-label="Writing suggestions">
              <button class="suggestion-card suggestion-very-hard warning-jump" type="button" data-jump-analysis="very-hard"><strong id="veryHardCount">0</strong><span>very hard sentences</span></button>
              <button class="suggestion-card suggestion-hard warning-jump" type="button" data-jump-analysis="hard"><strong id="hardCount">0</strong><span>hard sentences</span></button>
              <button class="suggestion-card suggestion-passive warning-jump" type="button" data-jump-analysis="passive"><strong id="passiveCount">0</strong><span>passive voice hints</span></button>
              <button class="suggestion-card suggestion-adverb warning-jump" type="button" data-jump-analysis="adverb"><strong id="adverbCount">0</strong><span>adverbs or intensifiers</span></button>
              <button class="suggestion-card suggestion-alternative warning-jump" type="button" data-jump-analysis="alternative"><strong id="alternativeCount">0</strong><span>simpler word ideas</span></button>
              <button class="suggestion-card suggestion-weak warning-jump" type="button" data-jump-analysis="weak"><strong id="weakCount">0</strong><span>weak phrases</span></button>
            </div>
            <p id="firstSuggestion" class="suggestion-note">No suggestions yet.</p>
            ${toolButton('toggleAnalysis', 'Toggle Analysis', 'vocabulary')}
          </section>
          <section>
            <p class="eyebrow">Teacher Tools</p>
            ${toolButton('open-template-dialog', 'Templates', 'template')}
            ${toolButton('mark-cloze', 'Cloze Builder', 'cloze')}
            ${toolButton('open-citation-dialog', 'Citation Assistant', 'citation')}
            ${toolButton('toggle-student-view', 'Student View', 'student')}
            ${toolButton('mark-teacher-only', 'Mark Teacher Only', 'teacher')}
            <div class="read-aloud-controls" aria-label="Read Aloud voice settings">
              <label>Voice <select id="readAloudVoice"><option value="">Browser default</option></select></label>
              <label>Speed <select id="readAloudRate">
                <option value="0.8">Slower</option>
                <option value="0.9" selected>Calm</option>
                <option value="1">Normal</option>
                <option value="1.15">Faster</option>
              </select></label>
            </div>
            ${toolButton('read-aloud', 'Read Aloud', 'play')}
            ${toolButton('stop-read-aloud', 'Stop Reading', 'stop')}
            ${toolButton('scramble-sentences', 'Scramble Sentences', 'scramble')}
            ${toolButton('insert-answer-key', 'Insert Answer Key', 'teacher')}
            ${toolButton('open-vocabulary-dialog', 'Vocabulary Highlighter', 'vocabulary')}
          </section>
        </aside>
        <button class="sidebar-scrim" type="button" data-action="toggle-sidebar" aria-label="Close sidebar"></button>
      </section>

      <footer class="status-bar">
        <span>Words: <strong id="statusWords">0</strong></span>
        <span>Sentences: <strong id="statusSentences">0</strong></span>
        <span>Grade estimate: <strong id="statusGrade">0</strong></span>
        <span id="statusSaved">Saved locally</span>
      </footer>
    </main>

    <input id="fileInput" type="file" accept=".writesplat.json,application/json" hidden>
    <input id="imageFileInput" type="file" accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp" hidden>
    <input id="importFileInput" type="file" accept=".md,.markdown,.txt,.text,.html,.htm,.docx" hidden>
    <div id="linkDialog" class="modal-backdrop" hidden>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="linkDialogTitle">
        <h2 id="linkDialogTitle">Insert link</h2>
        <label>Web address <input id="linkHref" type="url" placeholder="https://example.org"></label>
        <p class="modal-note">Select text in the document first, then add the link.</p>
        <div class="modal-actions">
          <button data-action="cancel-link-dialog">Cancel</button>
          <button class="primary-action" data-action="apply-link">Apply link</button>
        </div>
      </section>
    </div>
    <div id="templateDialog" class="modal-backdrop" hidden>
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-labelledby="templateDialogTitle">
        <h2 id="templateDialogTitle">Start from a template</h2>
        ${(['prose', 'poetry', 'academic', 'other'] as const)
          .map((category) => {
            const items = documentTemplates.filter((template) => template.category === category);
            if (!items.length) return '';
            return `
              <h3 class="template-group-title">${templateCategoryLabels[category]}</h3>
              <div class="template-grid">
                ${items
                  .map(
                    (template) => `
                      <button class="template-card" data-template-id="${template.id}">
                        <strong>${template.title}</strong>
                        <span>${template.description}</span>
                      </button>
                    `,
                  )
                  .join('')}
              </div>
            `;
          })
          .join('')}
        <div class="modal-actions">
          <button data-action="close-template-dialog">Close</button>
        </div>
      </section>
    </div>
    <div id="libraryDialog" class="modal-backdrop" hidden>
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-labelledby="libraryDialogTitle">
        <h2 id="libraryDialogTitle">Browser document library</h2>
        <p class="modal-note">Documents saved here stay in this browser profile. Export .writesplat.json for a durable copy you can move to another device.</p>
        <div id="libraryList" class="library-list"></div>
        <div class="modal-actions">
          <button data-action="close-local-library">Close</button>
          <button class="primary-action" data-action="save-local-document">Save current document</button>
        </div>
      </section>
    </div>
    <div id="findDialog" class="modal-backdrop" hidden>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="findDialogTitle">
        <h2 id="findDialogTitle">Find and replace</h2>
        <label>Find <input id="findText" type="text"></label>
        <label>Replace with <input id="replaceText" type="text"></label>
        <p id="findStatus" class="modal-note">Search is case-insensitive.</p>
        <div class="modal-actions">
          <button data-action="close-find-dialog">Close</button>
          <button data-action="find-next">Find</button>
          <button data-action="replace-selection">Replace</button>
          <button class="primary-action" data-action="replace-all">Replace all</button>
        </div>
      </section>
    </div>
    <div id="imageDialog" class="modal-backdrop" hidden>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="imageDialogTitle">
        <h2 id="imageDialogTitle">Insert image</h2>
        <label>Alt text <input id="imageAlt" type="text" placeholder="Describe the image"></label>
        <p class="modal-note">Images are embedded in the document as data URLs so they work offline. Large images can make save files large.</p>
        <div class="modal-actions">
          <button data-action="close-image-dialog">Cancel</button>
          <button class="primary-action" data-action="choose-image-file">Choose image</button>
        </div>
      </section>
    </div>
    <div id="emojiDialog" class="modal-backdrop" hidden>
      <section class="modal wide-modal emoji-modal" role="dialog" aria-modal="true" aria-labelledby="emojiDialogTitle">
        <h2 id="emojiDialogTitle">Insert emoji</h2>
        <input id="emojiSearch" type="search" placeholder="Search emojis… (or type :smile: while writing)" aria-label="Search emojis" autocomplete="off">
        <div class="emoji-tabs" id="emojiTabs">
          <button class="emoji-tab active" data-emoji-cat="all" type="button">All</button>
          ${emojiCategories.map((category) => `<button class="emoji-tab" data-emoji-cat="${category.id}" type="button">${category.label}</button>`).join('')}
        </div>
        <div class="emoji-grid" id="emojiGrid"></div>
        <div class="modal-actions">
          <button data-action="close-emoji-dialog">Close</button>
        </div>
      </section>
    </div>
    <div id="citationDialog" class="modal-backdrop" hidden>
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-labelledby="citationDialogTitle">
        <h2 id="citationDialogTitle">Citation assistant</h2>
        <div class="field-grid">
          <label>Style <select id="citationStyle"><option value="mla">MLA</option><option value="apa">APA</option><option value="chicago">Chicago</option></select></label>
          <label>Author <input id="citationAuthor" type="text"></label>
          <label>Title <input id="citationTitle" type="text"></label>
          <label>Publisher <input id="citationPublisher" type="text"></label>
          <label>Year <input id="citationYear" type="text"></label>
          <label>URL <input id="citationUrl" type="url"></label>
          <label>Access date <input id="citationAccessDate" type="text" placeholder="29 June 2026"></label>
        </div>
        <p id="citationPreview" class="modal-note">Fill in the fields, then insert the citation at the cursor.</p>
        <div class="modal-actions">
          <button data-action="close-citation-dialog">Cancel</button>
          <button data-action="insert-citations-section">Insert citations section</button>
          <button class="primary-action" data-action="insert-citation">Insert citation</button>
        </div>
      </section>
    </div>
    <div id="exportDialog" class="modal-backdrop" hidden>
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-labelledby="exportDialogTitle">
        <h2 id="exportDialogTitle">Export options</h2>
        <div class="export-list">
          <button data-action="export-text"><strong>Plain text (.txt)</strong><span>Removes formatting, images, tables, links, and teacher-only metadata.</span></button>
          <button data-action="export-markdown"><strong>Markdown (.md)</strong><span>Keeps headings, paragraphs, lists, links, and basic inline marks. Tables and images are simplified.</span></button>
          <button data-action="export-html"><strong>HTML (.html)</strong><span>Best browser-readable export. Keeps current document markup, images, tables, and links.</span></button>
          <button data-action="export-rtf"><strong>RTF (.rtf)</strong><span>Basic formatting only. Images become alt-text placeholders and tables become readable rows.</span></button>
          <button data-action="export-docx"><strong>Word (.docx)</strong><span>Exports headings, paragraphs, lists, simple tables, and basic inline formatting.</span></button>
          <button data-action="export-odt"><strong>OpenDocument (.odt)</strong><span>Exports headings, paragraphs, lists, links, simple tables, and basic inline formatting.</span></button>
          <button data-action="export-student-view"><strong>Student View HTML</strong><span>Strips teacher-only content from the exported document.</span></button>
        </div>
        <div class="modal-actions">
          <button data-action="close-export-dialog">Close</button>
        </div>
      </section>
    </div>
    <div id="vocabularyDialog" class="modal-backdrop" hidden>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="vocabularyDialogTitle">
        <h2 id="vocabularyDialogTitle">Vocabulary highlighter</h2>
        <label>Word list <textarea id="vocabularyTerms" rows="7" placeholder="moon&#10;orbit&#10;gravity"></textarea></label>
        <p id="vocabularyStatus" class="modal-note">Paste one term per line, or separate terms with commas.</p>
        <div class="modal-actions">
          <button data-action="clear-vocabulary">Clear</button>
          <button data-action="close-vocabulary-dialog">Close</button>
          <button class="primary-action" data-action="apply-vocabulary">Highlight terms</button>
        </div>
      </section>
    </div>
    <div id="helpDialog" class="modal-backdrop" hidden>
      <section class="modal wide-modal help-modal" role="dialog" aria-modal="true" aria-labelledby="helpDialogTitle">
        <h2 id="helpDialogTitle">WriteSplat help</h2>
        <div class="help-grid">
          <section>
            <h3>Start writing</h3>
            <p>Type in the page, use the icon toolbar for common formatting, and use Block Style for headings, body text, quotes, and code blocks.</p>
          </section>
          <section>
            <h3>Save safely</h3>
            <p>WriteSplat autosaves in this browser. Use Save JSON to create a durable .writesplat.json file that can move to another device.</p>
          </section>
          <section>
            <h3>Use teacher tools</h3>
            <p>The Teacher menu contains templates, cloze blanks, citation tools, student view, answer keys, vocabulary highlighting, and scramblers.</p>
          </section>
          <section>
            <h3>Readability</h3>
            <p>The right panel gives suggestions only. Highlights are overlays, so they do not change exports or undo history.</p>
          </section>
          <section>
            <h3>Privacy</h3>
            <p>No account, backend, analytics, telemetry, or required network service is used for normal editing.</p>
          </section>
          <section>
            <h3>Export</h3>
            <p>Use File > Export As for plain text, Markdown, HTML, RTF, DOCX, and student/teacher handout exports.</p>
          </section>
        </div>
        <div class="modal-actions">
          <button class="primary-action" data-action="close-help-dialog">Close</button>
        </div>
      </section>
    </div>
    <div id="shortcutsDialog" class="modal-backdrop" hidden>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="shortcutsDialogTitle">
        <h2 id="shortcutsDialogTitle">Keyboard shortcuts</h2>
        <dl class="shortcut-list">
          <div><dt>Ctrl/Cmd + B</dt><dd>Bold</dd></div>
          <div><dt>Ctrl/Cmd + I</dt><dd>Italic</dd></div>
          <div><dt>Ctrl/Cmd + U</dt><dd>Underline</dd></div>
          <div><dt>Ctrl/Cmd + Z</dt><dd>Undo</dd></div>
          <div><dt>Ctrl/Cmd + Shift + Z</dt><dd>Redo</dd></div>
          <div><dt>Escape</dt><dd>Close open menus</dd></div>
        </dl>
        <div class="modal-actions">
          <button class="primary-action" data-action="close-shortcuts-dialog">Close</button>
        </div>
      </section>
    </div>
  `;
}

function isSubmenu(item: MenuItem): item is MenuSubmenu {
  return !Array.isArray(item);
}

function menuItem(item: MenuItem): string {
  if (isSubmenu(item)) {
    return `
      <details class="menu-submenu">
        <summary>${item.label}</summary>
        <div class="submenu-panel">
          ${item.items.map(([action, text]) => `<button data-action="${action}">${text}</button>`).join('')}
        </div>
      </details>
    `;
  }

  const [action, text] = item;
  return `<button data-action="${action}">${text}</button>`;
}

function menu(label: string, items: MenuItem[], className = ''): string {
  return `
    <details class="menu ${className}">
      <summary>${label}</summary>
      <div class="menu-panel">
        ${items.map((item) => menuItem(item)).join('')}
      </div>
    </details>
  `;
}

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing #${id}`);
  }
  return element as T;
}

function downloadFile(filename: string, mimeType: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function fileSlug(title: string): string {
  return title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'writesplat';
}

function loadLibraryIndex(): LibraryEntry[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LIBRARY_INDEX_KEY) ?? '[]');
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry): entry is LibraryEntry =>
        entry &&
        typeof entry === 'object' &&
        typeof (entry as LibraryEntry).id === 'string' &&
        typeof (entry as LibraryEntry).title === 'string' &&
        typeof (entry as LibraryEntry).updatedAt === 'string',
    );
  } catch {
    return [];
  }
}

function saveLibraryIndex(entries: LibraryEntry[]): void {
  localStorage.setItem(LIBRARY_INDEX_KEY, JSON.stringify(entries));
}

function loadLocalDocument(id: string): WriteSplatFile | null {
  try {
    const raw = localStorage.getItem(`${LIBRARY_ITEM_PREFIX}${id}`);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    assertWriteSplatFile(parsed);
    return parsed;
  } catch {
    return null;
  }
}

function saveLocalDocument(id: string, file: WriteSplatFile): void {
  localStorage.setItem(`${LIBRARY_ITEM_PREFIX}${id}`, JSON.stringify(file));
  const nextEntry = {
    id,
    title: file.metadata.title,
    updatedAt: file.updatedAt,
  };
  const entries = [nextEntry, ...loadLibraryIndex().filter((entry) => entry.id !== id)].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  saveLibraryIndex(entries);
}

function deleteLocalDocument(id: string): void {
  localStorage.removeItem(`${LIBRARY_ITEM_PREFIX}${id}`);
  saveLibraryIndex(loadLibraryIndex().filter((entry) => entry.id !== id));
}

function renderLibraryList(container: HTMLElement): void {
  const entries = loadLibraryIndex()
    .map((entry) => ({ entry, file: loadLocalDocument(entry.id) }))
    .filter((item): item is { entry: LibraryEntry; file: WriteSplatFile } => Boolean(item.file));

  if (entries.length === 0) {
    container.innerHTML = '<p class="empty-state">No browser-saved documents yet.</p>';
    return;
  }

  container.innerHTML = entries
    .map(
      ({ entry, file }) => `
        <article class="library-item">
          <div>
            <strong>${escapeHtml(file.metadata.title)}</strong>
            <span>Updated ${new Date(entry.updatedAt).toLocaleString()}</span>
          </div>
          <div class="library-actions">
            <button type="button" data-library-open="${escapeHtml(entry.id)}">Open</button>
            <button type="button" data-library-delete="${escapeHtml(entry.id)}">Delete</button>
          </div>
        </article>
      `,
    )
    .join('');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char];
  });
}

function isEditorCommand(value: string): value is EditorCommand {
  return [
    'bold',
    'italic',
    'underline',
    'strike',
    'heading1',
    'heading2',
    'heading3',
    'heading4',
    'heading5',
    'heading6',
    'paragraph',
    'blockquote',
    'codeBlock',
    'bulletList',
    'orderedList',
    'insertTable',
    'insertHorizontalRule',
    'insertPageBreak',
    'addTableRow',
    'addTableColumn',
    'deleteTableRow',
    'deleteTableColumn',
    'mergeTableCells',
    'splitTableCell',
    'deleteTable',
    'undo',
    'redo',
    'toggleAnalysis',
  ].includes(value);
}

function bootstrap(): void {
  const root = getRequiredElement<HTMLDivElement>('app');
  root.innerHTML = appHtml();

  const editorMount = getRequiredElement<HTMLElement>('editor');
  const markdownSource = getRequiredElement<HTMLTextAreaElement>('markdownSource');
  const alignmentSelect = getRequiredElement<HTMLSelectElement>('alignmentSelect');
  const blockStyleSelect = getRequiredElement<HTMLSelectElement>('blockStyleSelect');
  const fontFamilySelect = getRequiredElement<HTMLSelectElement>('fontFamilySelect');
  const fontSizeSelect = getRequiredElement<HTMLSelectElement>('fontSizeSelect');
  const highlightColorSelect = getRequiredElement<HTMLSelectElement>('highlightColorSelect');
  const textColorSelect = getRequiredElement<HTMLSelectElement>('textColorSelect');
  const zoomSelect = getRequiredElement<HTMLSelectElement>('zoomSelect');
  const titleInput = getRequiredElement<HTMLInputElement>('docTitle');
  const authorInput = getRequiredElement<HTMLInputElement>('docAuthor');
  const targetGradeSelect = getRequiredElement<HTMLSelectElement>('targetGrade');
  const fileInput = getRequiredElement<HTMLInputElement>('fileInput');
  const imageFileInput = getRequiredElement<HTMLInputElement>('imageFileInput');
  const importFileInput = getRequiredElement<HTMLInputElement>('importFileInput');
  const linkDialog = getRequiredElement<HTMLElement>('linkDialog');
  const linkHref = getRequiredElement<HTMLInputElement>('linkHref');
  const templateDialog = getRequiredElement<HTMLElement>('templateDialog');
  const libraryDialog = getRequiredElement<HTMLElement>('libraryDialog');
  const libraryList = getRequiredElement<HTMLElement>('libraryList');
  const findDialog = getRequiredElement<HTMLElement>('findDialog');
  const findText = getRequiredElement<HTMLInputElement>('findText');
  const replaceText = getRequiredElement<HTMLInputElement>('replaceText');
  const findStatus = getRequiredElement<HTMLElement>('findStatus');
  const imageDialog = getRequiredElement<HTMLElement>('imageDialog');
  const imageAlt = getRequiredElement<HTMLInputElement>('imageAlt');
  const emojiDialog = getRequiredElement<HTMLElement>('emojiDialog');
  const emojiSearch = getRequiredElement<HTMLInputElement>('emojiSearch');
  const emojiGrid = getRequiredElement<HTMLElement>('emojiGrid');
  const emojiTabs = getRequiredElement<HTMLElement>('emojiTabs');
  let emojiCategoryId = 'all';

  function renderEmojiGrid(): void {
    const query = emojiSearch.value.trim();
    let items: Array<{ char: string; name: string }>;
    if (query) {
      items = searchEmojis(query);
    } else if (emojiCategoryId === 'all') {
      items = emojiCategories.flatMap((category) => category.emojis.map((emoji) => ({ char: emoji.char, name: emoji.name })));
    } else {
      const category = emojiCategories.find((item) => item.id === emojiCategoryId);
      items = category ? category.emojis.map((emoji) => ({ char: emoji.char, name: emoji.name })) : [];
    }
    emojiGrid.innerHTML = items.length
      ? items.map((emoji) => `<button class="emoji-cell" type="button" data-emoji="${emoji.char}" title="${emoji.name}" aria-label="${emoji.name}">${emoji.char}</button>`).join('')
      : '<p class="modal-note">No emojis match your search.</p>';
  }
  const citationDialog = getRequiredElement<HTMLElement>('citationDialog');
  const citationPreview = getRequiredElement<HTMLElement>('citationPreview');
  const exportDialog = getRequiredElement<HTMLElement>('exportDialog');
  const vocabularyDialog = getRequiredElement<HTMLElement>('vocabularyDialog');
  const vocabularyTerms = getRequiredElement<HTMLTextAreaElement>('vocabularyTerms');
  const vocabularyStatus = getRequiredElement<HTMLElement>('vocabularyStatus');
  const languageSwitcher = getRequiredElement<HTMLSelectElement>('languageSwitcher');
  const readAloudVoiceSelect = getRequiredElement<HTMLSelectElement>('readAloudVoice');
  const readAloudRateSelect = getRequiredElement<HTMLSelectElement>('readAloudRate');
  const helpDialog = getRequiredElement<HTMLElement>('helpDialog');
  const shortcutsDialog = getRequiredElement<HTMLElement>('shortcutsDialog');
  const citationFields = {
    style: getRequiredElement<HTMLSelectElement>('citationStyle'),
    author: getRequiredElement<HTMLInputElement>('citationAuthor'),
    title: getRequiredElement<HTMLInputElement>('citationTitle'),
    publisher: getRequiredElement<HTMLInputElement>('citationPublisher'),
    year: getRequiredElement<HTMLInputElement>('citationYear'),
    url: getRequiredElement<HTMLInputElement>('citationUrl'),
    accessDate: getRequiredElement<HTMLInputElement>('citationAccessDate'),
  };
  const sidebar = getRequiredElement<HTMLElement>('sidebar');
  let analysisTimer = 0;
  let saveTimer = 0;
  let initialHtml = starterBody;
  let markdownMode: MarkdownMode = 'wysiwyg';
  let syncingMarkdown = false;
  let studentView = false;
  let targetGrade = Number(targetGradeSelect.value);
  let currentLocalDocumentId: string | null = null;
  let availableVoices: SpeechSynthesisVoice[] = [];
  let citations: string[] = [];
  let answerKey: string[] = [];

  const saved = localStorage.getItem(AUTOSAVE_KEY);
  if (saved) {
    try {
      const parsed: unknown = JSON.parse(saved);
      assertWriteSplatFile(parsed);
      titleInput.value = parsed.metadata.title;
      authorInput.value = parsed.metadata.author;
      targetGradeSelect.value = parsed.metadata.targetGrade;
      targetGrade = Number(targetGradeSelect.value);
      citations = parsed.teacher.citations;
      answerKey = parsed.teacher.answerKey;
      studentView = parsed.teacher.studentView;
      if (parsed.document.format === 'html') {
        initialHtml = parsed.document.body;
      }
    } catch {
      initialHtml = starterBody;
    }
  }

  const writer = createWriterEditor(editorMount, initialHtml, refresh);

  if (saved) {
    try {
      const parsed: unknown = JSON.parse(saved);
      assertWriteSplatFile(parsed);
      if (parsed.document.format === 'prosemirror-json') {
        writer.setJson(parsed.document.content);
      }
    } catch {
      writer.setHtml(starterBody);
    }
  }

  function updateStats(): void {
    const html = writer.getHtml();
    const stats = countDocumentStats(html);
    const text = documentTextFromHtml(html);
    const readability = analyzeReadability(text);
    const warnings = analyzeWritingWarnings(text, targetGrade);
    const letters = (text.match(/\p{L}/gu) ?? []).length;
    const readingSeconds = Math.max(0, Math.round((stats.words / 185) * 60));
    getRequiredElement('wordCount').textContent = String(stats.words);
    getRequiredElement('sentenceCount').textContent = String(stats.sentences);
    getRequiredElement('paragraphCount').textContent = String(stats.paragraphs);
    getRequiredElement('letterCount').textContent = String(letters);
    getRequiredElement('characterCount').textContent = String(text.length);
    getRequiredElement('readingTime').textContent = formatReadingTime(readingSeconds);
    getRequiredElement('statusWords').textContent = String(stats.words);
    getRequiredElement('statusSentences').textContent = String(stats.sentences);
    getRequiredElement('readabilityGradeLabel').textContent = `Grade ${readability.fleschKincaidGrade}`;
    getRequiredElement('readabilityStatus').textContent = readability.fleschKincaidGrade <= targetGrade + 1 ? 'Good.' : 'Needs a little smoothing.';
    getRequiredElement('readingEase').textContent = String(readability.fleschReadingEase);
    getRequiredElement('syllableCount').textContent = String(readability.syllables);
    getRequiredElement('statusGrade').textContent = String(readability.fleschKincaidGrade);
    updateWarningSummary(warnings);
  }

  function autosave(): void {
    window.clearTimeout(saveTimer);
    getRequiredElement('saveState').textContent = 'Saving...';
      getRequiredElement('statusSaved').textContent = 'Saving...';
    saveTimer = window.setTimeout(() => {
      const file = createCurrentNativeFile();
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(file));
      if (currentLocalDocumentId) {
        saveLocalDocument(currentLocalDocumentId, file);
      }
      getRequiredElement('saveState').textContent = 'Saved locally';
      getRequiredElement('statusSaved').textContent = 'Saved locally';
    }, 600);
  }

  function scheduleStatsUpdate(): void {
    window.clearTimeout(analysisTimer);
    analysisTimer = window.setTimeout(updateStats, ANALYSIS_DEBOUNCE_MS);
  }

  function createCurrentNativeFile(existing?: WriteSplatFile): WriteSplatFile {
    return createNativeFile(titleInput.value, writer.getJson(), {
      createdAt: existing?.createdAt,
      answerKey,
      author: authorInput.value,
      citations,
      studentView,
      targetGrade: targetGradeSelect.value,
    });
  }

  function refresh(): void {
    syncMarkdownFromEditor();
    scheduleStatsUpdate();
    autosave();
  }

  function syncMarkdownFromEditor(): void {
    if (markdownMode === 'wysiwyg' || syncingMarkdown || document.activeElement === markdownSource) {
      return;
    }

    markdownSource.value = htmlToMarkdown(writer.getHtml());
  }

  function applyMarkdownSource(): void {
    syncingMarkdown = true;
    writer.setHtml(markdownToHtml(markdownSource.value));
    syncingMarkdown = false;
    refresh();
  }

  function setMarkdownMode(mode: MarkdownMode): void {
    if (markdownMode !== 'wysiwyg' && mode === 'wysiwyg') {
      applyMarkdownSource();
    }

    markdownMode = mode;
    document.body.dataset.markdownMode = mode;

    if (mode !== 'wysiwyg') {
      markdownSource.value = htmlToMarkdown(writer.getHtml());
    }

    if (mode === 'raw') {
      markdownSource.focus();
    } else {
      writer.view.focus();
    }
  }

  function toggleSidebar(): void {
    if (window.matchMedia('(max-width: 900px)').matches) {
      const isOpen = document.body.classList.toggle('sidebar-open');
      document.body.classList.remove('sidebar-collapsed');
      sidebar.setAttribute('aria-hidden', String(!isOpen));
      return;
    }

    const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
    document.body.classList.remove('sidebar-open');
    sidebar.setAttribute('aria-hidden', String(isCollapsed));
  }

  function syncSidebarMode(): void {
    if (window.matchMedia('(max-width: 900px)').matches) {
      document.body.classList.remove('sidebar-collapsed');
      sidebar.setAttribute('aria-hidden', String(!document.body.classList.contains('sidebar-open')));
      return;
    }

    document.body.classList.remove('sidebar-open');
    sidebar.setAttribute('aria-hidden', String(document.body.classList.contains('sidebar-collapsed')));
  }

  function closeMenus(except?: HTMLDetailsElement | null): void {
    root.querySelectorAll<HTMLDetailsElement>('.menu[open], .menu-submenu[open]').forEach((menuElement) => {
      if (menuElement !== except && !except?.contains(menuElement)) {
        menuElement.open = false;
      }
    });
  }

  root.addEventListener(
    'toggle',
    (event) => {
      const menuElement = event.target instanceof HTMLDetailsElement ? event.target : null;
      if (!menuElement?.open || !menuElement.classList.contains('menu')) {
        return;
      }
      closeMenus(menuElement);
    },
    true,
  );

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (!root.contains(target) || !target.closest('.menu')) {
      closeMenus();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenus();
    }
  });

  root.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    const commandButton = target.closest<HTMLButtonElement>('[data-command]');
    const templateButton = target.closest<HTMLButtonElement>('[data-template-id]');
    const libraryOpenButton = target.closest<HTMLButtonElement>('[data-library-open]');
    const libraryDeleteButton = target.closest<HTMLButtonElement>('[data-library-delete]');
    const warningJumpButton = target.closest<HTMLButtonElement>('[data-jump-analysis]');
    const actionButton = target.closest<HTMLElement>('[data-action]');

    if (libraryOpenButton?.dataset.libraryOpen) {
      const file = loadLocalDocument(libraryOpenButton.dataset.libraryOpen);
      if (file) {
        loadNativeFile(file);
        currentLocalDocumentId = libraryOpenButton.dataset.libraryOpen;
        libraryDialog.hidden = true;
        refresh();
      }
      return;
    }

    if (libraryDeleteButton?.dataset.libraryDelete) {
      deleteLocalDocument(libraryDeleteButton.dataset.libraryDelete);
      renderLibraryList(libraryList);
      return;
    }

    if (warningJumpButton?.dataset.jumpAnalysis) {
      jumpToAnalysisHighlight(warningJumpButton.dataset.jumpAnalysis);
      return;
    }

    if (templateButton?.dataset.templateId) {
      const template = documentTemplates.find((item) => item.id === templateButton.dataset.templateId);
      if (template) {
        titleInput.value = template.title;
        writer.setHtml(template.html);
        templateDialog.hidden = true;
        refresh();
      }
      return;
    }

    const emojiCell = target.closest<HTMLButtonElement>('[data-emoji]');
    if (emojiCell?.dataset.emoji) {
      writer.insertText(emojiCell.dataset.emoji);
      refresh();
      return;
    }

    const emojiTab = target.closest<HTMLButtonElement>('[data-emoji-cat]');
    if (emojiTab?.dataset.emojiCat) {
      emojiCategoryId = emojiTab.dataset.emojiCat;
      emojiTabs.querySelectorAll('.emoji-tab').forEach((tab) => tab.classList.toggle('active', tab === emojiTab));
      emojiSearch.value = '';
      renderEmojiGrid();
      return;
    }

    if (commandButton?.dataset.command) {
      writer.run(commandButton.dataset.command as EditorCommand);
      refresh();
      closeMenus();
      return;
    }

    const action = actionButton?.dataset.action;
    if (!action) {
      return;
    }

    if (isEditorCommand(action)) {
      writer.run(action);
      refresh();
    } else if (action === 'new-document') {
      titleInput.value = 'Untitled Document';
      authorInput.value = '';
      targetGradeSelect.value = '6';
      targetGrade = 6;
      currentLocalDocumentId = null;
      citations = [];
      answerKey = [];
      studentView = false;
      document.body.classList.remove('student-view');
      writer.setAnalysisTargetGrade(targetGrade);
      writer.setHtml(starterBody);
      refresh();
    } else if (action === 'save-local-document') {
      const id = currentLocalDocumentId ?? crypto.randomUUID();
      const existing = currentLocalDocumentId ? loadLocalDocument(currentLocalDocumentId) ?? undefined : undefined;
      const file = createCurrentNativeFile(existing);
      currentLocalDocumentId = id;
      saveLocalDocument(id, file);
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(file));
      renderLibraryList(libraryList);
      getRequiredElement('saveState').textContent = 'Saved to browser';
      getRequiredElement('statusSaved').textContent = 'Saved to browser';
    } else if (action === 'open-local-library') {
      renderLibraryList(libraryList);
      libraryDialog.hidden = false;
    } else if (action === 'close-local-library') {
      libraryDialog.hidden = true;
      writer.view.focus();
    } else if (action === 'save-json') {
      const file = createCurrentNativeFile();
      downloadFile(`${fileSlug(file.metadata.title)}.writesplat.json`, 'application/json', `${JSON.stringify(file, null, 2)}\n`);
    } else if (action === 'open-json') {
      fileInput.click();
    } else if (action === 'open-export-dialog') {
      exportDialog.hidden = false;
    } else if (action === 'close-export-dialog') {
      exportDialog.hidden = true;
      writer.view.focus();
    } else if (action === 'open-help-dialog') {
      helpDialog.hidden = false;
    } else if (action === 'close-help-dialog') {
      helpDialog.hidden = true;
      writer.view.focus();
    } else if (action === 'open-shortcuts-dialog') {
      shortcutsDialog.hidden = false;
    } else if (action === 'close-shortcuts-dialog') {
      shortcutsDialog.hidden = true;
      writer.view.focus();
    } else if (action === 'open-link-dialog') {
      linkHref.value = '';
      linkDialog.hidden = false;
      linkHref.focus();
    } else if (action === 'cancel-link-dialog') {
      linkDialog.hidden = true;
      writer.view.focus();
    } else if (action === 'apply-link') {
      writer.setLink(linkHref.value);
      linkDialog.hidden = true;
      refresh();
    } else if (action === 'remove-link') {
      writer.removeLink();
      refresh();
    } else if (action === 'open-template-dialog') {
      templateDialog.hidden = false;
    } else if (action === 'close-template-dialog') {
      templateDialog.hidden = true;
      writer.view.focus();
    } else if (action === 'open-find-dialog') {
      findDialog.hidden = false;
      findText.focus();
    } else if (action === 'close-find-dialog') {
      findDialog.hidden = true;
      writer.view.focus();
    } else if (action === 'find-next') {
      findStatus.textContent = writer.findText(findText.value) ? 'Found a match.' : 'No match found.';
    } else if (action === 'replace-selection') {
      findStatus.textContent = writer.replaceSelection(replaceText.value) ? 'Replaced selected text.' : 'Select a match first.';
      refresh();
    } else if (action === 'replace-all') {
      const count = writer.replaceAll(findText.value, replaceText.value);
      findStatus.textContent = `Replaced ${count} match${count === 1 ? '' : 'es'}.`;
      refresh();
    } else if (action === 'open-image-dialog') {
      imageAlt.value = '';
      imageDialog.hidden = false;
      imageAlt.focus();
    } else if (action === 'close-image-dialog') {
      imageDialog.hidden = true;
      writer.view.focus();
    } else if (action === 'open-emoji-dialog') {
      emojiSearch.value = '';
      renderEmojiGrid();
      emojiDialog.hidden = false;
      emojiSearch.focus();
    } else if (action === 'close-emoji-dialog') {
      emojiDialog.hidden = true;
      writer.view.focus();
    } else if (action === 'import-file') {
      importFileInput.click();
    } else if (action === 'choose-image-file') {
      imageFileInput.click();
    } else if (action === 'open-citation-dialog') {
      citationDialog.hidden = false;
      updateCitationPreview();
      citationFields.author.focus();
    } else if (action === 'close-citation-dialog') {
      citationDialog.hidden = true;
      writer.view.focus();
    } else if (action === 'insert-citation') {
      const citation = getCitationText();
      addCitation(citation);
      writer.insertText(citation);
      citationDialog.hidden = true;
      refresh();
    } else if (action === 'insert-citations-section') {
      insertCitationsSection();
      citationDialog.hidden = true;
      refresh();
    } else if (action === 'mark-cloze') {
      writer.markCloze();
      refresh();
    } else if (action === 'remove-cloze') {
      writer.removeCloze();
      refresh();
    } else if (action === 'export-text') {
      downloadFile(`${fileSlug(titleInput.value)}.txt`, 'text/plain', htmlToPlainText(writer.getHtml()));
    } else if (action === 'export-markdown') {
      downloadFile(`${fileSlug(titleInput.value)}.md`, 'text/markdown', htmlToMarkdown(writer.getHtml()));
    } else if (action === 'export-html') {
      downloadFile(
        `${fileSlug(titleInput.value)}.html`,
        'text/html',
        createStandaloneHtml(titleInput.value.trim() || 'Untitled Document', writer.getHtml()),
      );
    } else if (action === 'export-rtf') {
      downloadFile(`${fileSlug(titleInput.value)}.rtf`, 'application/rtf', htmlToRtf(writer.getHtml()));
    } else if (action === 'export-docx') {
      const blob = await htmlToDocxBlob(titleInput.value.trim() || 'Untitled Document', writer.getHtml());
      downloadBlob(`${fileSlug(titleInput.value)}.docx`, blob);
    } else if (action === 'export-odt') {
      const blob = htmlToOdtBlob(titleInput.value.trim() || 'Untitled Document', writer.getHtml());
      downloadBlob(`${fileSlug(titleInput.value)}.odt`, blob);
    } else if (action === 'export-student-cloze') {
      downloadFile(
        `${fileSlug(titleInput.value)}-student.html`,
        'text/html',
        createStandaloneHtml(`${titleInput.value.trim() || 'Untitled Document'} - Student`, createStudentClozeHtml(writer.getHtml())),
      );
    } else if (action === 'export-teacher-cloze') {
      downloadFile(
        `${fileSlug(titleInput.value)}-teacher.html`,
        'text/html',
        createStandaloneHtml(`${titleInput.value.trim() || 'Untitled Document'} - Teacher`, createTeacherClozeHtml(writer.getHtml())),
      );
    } else if (action === 'export-student-view') {
      downloadFile(
        `${fileSlug(titleInput.value)}-student-view.html`,
        'text/html',
        createStandaloneHtml(`${titleInput.value.trim() || 'Untitled Document'} - Student View`, createStudentViewHtml(writer.getHtml())),
      );
    } else if (action === 'export-teacher-view') {
      downloadFile(
        `${fileSlug(titleInput.value)}-teacher-view.html`,
        'text/html',
        createStandaloneHtml(`${titleInput.value.trim() || 'Untitled Document'} - Teacher View`, createTeacherViewHtml(writer.getHtml())),
      );
    } else if (action === 'print') {
      window.print();
    } else if (action === 'toggle-sidebar') {
      toggleSidebar();
    } else if (action === 'toggle-theme') {
      document.body.classList.toggle('dark');
    } else if (action === 'markdown-wysiwyg') {
      setMarkdownMode('wysiwyg');
    } else if (action === 'markdown-raw') {
      setMarkdownMode('raw');
    } else if (action === 'markdown-split') {
      setMarkdownMode('split');
    } else if (action === 'toggle-student-view') {
      studentView = !studentView;
      document.body.classList.toggle('student-view', studentView);
    } else if (action === 'mark-teacher-only') {
      writer.markTeacherOnly();
      refresh();
    } else if (action === 'remove-teacher-only') {
      writer.removeTeacherOnly();
      refresh();
    } else if (action === 'read-aloud') {
      const selectedVoice = availableVoices.find((voice) => voice.voiceURI === readAloudVoiceSelect.value) ?? null;
      readTextAloud(documentTextFromHtml(writer.getHtml()), {
        onBoundary: (charIndex, charLength) => writer.setReadAloudTextOffset(charIndex, charLength),
        onEnd: () => writer.clearReadAloudHighlight(),
        pitch: 0.95,
        rate: Number(readAloudRateSelect.value) || 0.9,
        voice: selectedVoice,
      });
    } else if (action === 'pause-read-aloud') {
      pauseReadAloud();
    } else if (action === 'stop-read-aloud') {
      stopReadAloud();
      writer.clearReadAloudHighlight();
    } else if (action === 'scramble-sentences') {
      const original = writer.getSelectionText();
      rememberAnswerKey(original);
      writer.replaceSelection(scrambleSentences(original));
      refresh();
    } else if (action === 'scramble-paragraphs') {
      const original = writer.getSelectionText();
      rememberAnswerKey(original);
      writer.replaceSelection(scrambleParagraphs(original));
      refresh();
    } else if (action === 'insert-answer-key') {
      insertAnswerKeySection();
      refresh();
    } else if (action === 'open-vocabulary-dialog') {
      vocabularyDialog.hidden = false;
      vocabularyTerms.focus();
    } else if (action === 'close-vocabulary-dialog') {
      vocabularyDialog.hidden = true;
      writer.view.focus();
    } else if (action === 'apply-vocabulary') {
      const terms = parseVocabularyTerms(vocabularyTerms.value);
      writer.setVocabularyTerms(terms);
      vocabularyStatus.textContent = `Highlighting ${terms.length} term${terms.length === 1 ? '' : 's'}.`;
      vocabularyDialog.hidden = true;
      writer.view.focus();
    } else if (action === 'clear-vocabulary') {
      vocabularyTerms.value = '';
      writer.setVocabularyTerms([]);
      vocabularyStatus.textContent = 'Vocabulary highlights cleared.';
      writer.view.focus();
    }

    closeMenus();
  });

  targetGradeSelect.addEventListener('change', () => {
    targetGrade = Number(targetGradeSelect.value);
    writer.setAnalysisTargetGrade(targetGrade);
    updateStats();
  });

  markdownSource.addEventListener('input', () => {
    if (markdownMode !== 'wysiwyg') {
      applyMarkdownSource();
    }
  });

  authorInput.addEventListener('input', refresh);

  fontFamilySelect.addEventListener('change', () => {
    writer.setFontFamily(fontFamilySelect.value);
    fontFamilySelect.value = '';
    refresh();
  });

  fontSizeSelect.addEventListener('change', () => {
    writer.setFontSize(fontSizeSelect.value);
    fontSizeSelect.value = '';
    refresh();
  });

  blockStyleSelect.addEventListener('change', () => {
    const command = blockStyleSelect.value;
    if (isEditorCommand(command)) {
      writer.run(command);
      refresh();
    }
    blockStyleSelect.value = 'paragraph';
  });

  textColorSelect.addEventListener('change', () => {
    writer.setTextColor(textColorSelect.value);
    textColorSelect.value = '';
    refresh();
  });

  highlightColorSelect.addEventListener('change', () => {
    writer.setHighlightColor(highlightColorSelect.value);
    highlightColorSelect.value = '';
    refresh();
  });

  alignmentSelect.addEventListener('change', () => {
    writer.setTextAlignment(alignmentSelect.value);
    alignmentSelect.value = '';
    refresh();
  });

  zoomSelect.addEventListener('change', () => {
    setEditorZoom(zoomSelect.value);
  });

  readAloudVoiceSelect.addEventListener('change', () => {
    try {
      localStorage.setItem(READ_ALOUD_VOICE_KEY, readAloudVoiceSelect.value);
    } catch {
      // Read-aloud voice is a convenience preference only.
    }
  });

  readAloudRateSelect.addEventListener('change', () => {
    try {
      localStorage.setItem(READ_ALOUD_RATE_KEY, readAloudRateSelect.value);
    } catch {
      // Read-aloud speed is a convenience preference only.
    }
  });

  languageSwitcher.addEventListener('change', () => {
    const language = normalizeLanguage(languageSwitcher.value);
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // Language selection is a convenience preference only.
    }
    applyLanguage(root, language);
  });

  window.addEventListener('resize', syncSidebarMode);
  syncSidebarMode();
  applyLanguage(root, normalizeLanguage(languageSwitcher.value));
  refreshReadAloudVoices();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener('voiceschanged', refreshReadAloudVoices);
  }

  function loadNativeFile(file: WriteSplatFile): void {
    titleInput.value = file.metadata.title;
    authorInput.value = file.metadata.author;
    targetGradeSelect.value = file.metadata.targetGrade || '6';
    targetGrade = Number(targetGradeSelect.value);
    citations = file.teacher.citations;
    answerKey = file.teacher.answerKey;
    studentView = file.teacher.studentView;
    document.body.classList.toggle('student-view', studentView);
    writer.setAnalysisTargetGrade(targetGrade);

    if (file.document.format === 'html') {
      writer.setHtml(file.document.body);
    } else {
      writer.setJson(file.document.content);
    }
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      return;
    }

    const parsed: unknown = JSON.parse(await file.text());
    assertWriteSplatFile(parsed);
    loadNativeFile(parsed);
    currentLocalDocumentId = null;
    refresh();
    fileInput.value = '';
  });
  imageFileInput.addEventListener('change', async () => {
    const file = imageFileInput.files?.[0];
    if (!file) {
      return;
    }

    const src = await fileToDataUrl(file);
    writer.insertImage(src, imageAlt.value);
    imageDialog.hidden = true;
    imageFileInput.value = '';
    refresh();
  });
  importFileInput.addEventListener('change', async () => {
    const file = importFileInput.files?.[0];
    importFileInput.value = '';
    if (!file) return;
    const name = file.name;
    const baseTitle = name.replace(/\.[^.]+$/, '');
    try {
      if (/\.docx$/i.test(name)) {
        writer.setHtml(await docxToHtml(await file.arrayBuffer()));
      } else if (/\.(md|markdown)$/i.test(name)) {
        writer.setHtml(markdownToHtml(await file.text()));
      } else if (/\.(html?|htm)$/i.test(name)) {
        const parsed = new DOMParser().parseFromString(await file.text(), 'text/html');
        parsed.querySelectorAll('script, style, link, meta').forEach((node) => node.remove());
        writer.setHtml(parsed.body.innerHTML || '<p></p>');
      } else {
        const text = await file.text();
        writer.setHtml(text.split(/\n{2,}/).map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`).join('') || '<p></p>');
      }
      titleInput.value = baseTitle || 'Imported Document';
      currentLocalDocumentId = null;
      refresh();
      getRequiredElement('statusSaved').textContent = `Imported ${name}`;
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not import that file.');
    }
  });
  editorMount.addEventListener('paste', async (event) => {
    const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) => item.type.startsWith('image/'));
    const file = imageItem?.getAsFile();

    if (!file) {
      return;
    }

    event.preventDefault();
    const src = await fileToDataUrl(file);
    writer.insertImage(src, file.name || 'Pasted image');
    refresh();
  });
  editorMount.addEventListener('dragover', (event) => {
    if (Array.from(event.dataTransfer?.types ?? []).includes('Files')) {
      event.preventDefault();
      editorMount.classList.add('drop-active');
    }
  });
  editorMount.addEventListener('dragleave', (event) => {
    if (!editorMount.contains(event.relatedTarget as Node)) editorMount.classList.remove('drop-active');
  });
  editorMount.addEventListener('drop', async (event) => {
    const imageFile = Array.from(event.dataTransfer?.files ?? []).find((file) => file.type.startsWith('image/'));
    editorMount.classList.remove('drop-active');
    if (!imageFile) return;
    event.preventDefault();
    const src = await fileToDataUrl(imageFile);
    writer.insertImage(src, imageFile.name || 'Dropped image');
    refresh();
  });
  emojiSearch.addEventListener('input', () => {
    emojiTabs.querySelectorAll('.emoji-tab').forEach((tab) => tab.classList.toggle('active', (tab as HTMLElement).dataset.emojiCat === 'all'));
    emojiCategoryId = 'all';
    renderEmojiGrid();
  });
  emojiSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      emojiDialog.hidden = true;
      writer.view.focus();
    }
  });
  // MultiScribe-style :shortcode: conversion while typing in the editor.
  editorMount.addEventListener('keyup', (event) => {
    if (event.key === ':') {
      if (writer.tryEmojiShortcode(emojiForShortcode)) refresh();
    }
  });

  titleInput.addEventListener('input', refresh);
  linkHref.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      writer.setLink(linkHref.value);
      linkDialog.hidden = true;
      refresh();
    }

    if (event.key === 'Escape') {
      linkDialog.hidden = true;
      writer.view.focus();
    }
  });
  templateDialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      templateDialog.hidden = true;
      writer.view.focus();
    }
  });
  findDialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      findDialog.hidden = true;
      writer.view.focus();
    }
  });
  imageDialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      imageDialog.hidden = true;
      writer.view.focus();
    }
  });
  citationDialog.addEventListener('input', updateCitationPreview);
  citationDialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      citationDialog.hidden = true;
      writer.view.focus();
    }
  });
  exportDialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      exportDialog.hidden = true;
      writer.view.focus();
    }
  });
  vocabularyDialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      vocabularyDialog.hidden = true;
      writer.view.focus();
    }
  });
  updateStats();
  autosave();

  function getCitationText(): string {
    return formatCitation({
      style: citationFields.style.value as CitationStyle,
      author: citationFields.author.value,
      title: citationFields.title.value,
      publisher: citationFields.publisher.value,
      year: citationFields.year.value,
      url: citationFields.url.value,
      accessDate: citationFields.accessDate.value,
    });
  }

  function addCitation(citation: string): void {
    const trimmed = citation.trim();

    if (trimmed && !citations.includes(trimmed)) {
      citations.push(trimmed);
    }
  }

  function insertCitationsSection(): void {
    const currentCitation = getCitationText();
    addCitation(currentCitation);

    if (citations.length === 0) {
      return;
    }

    const host = document.createElement('div');
    host.innerHTML = writer.getHtml();
    const existingHeading = Array.from(host.querySelectorAll('h2')).find(
      (heading) => heading.textContent?.trim().toLowerCase() === 'works cited',
    );

    if (existingHeading) {
      const next = existingHeading.nextElementSibling;
      if (next?.tagName.toLowerCase() === 'ul') {
        next.remove();
      }
      existingHeading.remove();
    }

    host.insertAdjacentHTML(
      'beforeend',
      `<h2>Works Cited</h2><ul>${citations.map((citation) => `<li>${escapeHtml(citation)}</li>`).join('')}</ul>`,
    );
    writer.setHtml(host.innerHTML);
  }

  function rememberAnswerKey(value: string): void {
    const normalized = value.replace(/\s+/g, ' ').trim();

    if (normalized && !answerKey.includes(normalized)) {
      answerKey.push(normalized);
    }
  }

  function insertAnswerKeySection(): void {
    if (answerKey.length === 0) {
      return;
    }

    const host = document.createElement('div');
    host.innerHTML = writer.getHtml();
    const existingHeading = Array.from(host.querySelectorAll('h2')).find(
      (heading) => heading.textContent?.trim().toLowerCase() === 'answer key',
    );

    if (existingHeading) {
      const next = existingHeading.nextElementSibling;
      if (next?.tagName.toLowerCase() === 'ol') {
        next.remove();
      }
      existingHeading.remove();
    }

    host.insertAdjacentHTML(
      'beforeend',
      `<div class="teacher-only teacher-only-block" data-teacher-only="true"><h2>Answer Key</h2><ol>${answerKey
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ol></div>`,
    );
    writer.setHtml(host.innerHTML);
  }

  function setEditorZoom(value: string): void {
    const allowed = new Set(['0.85', '1', '1.15', '1.3']);
    const zoom = allowed.has(value) ? value : '1';
    editorMount.dataset.zoom = zoom;
    editorMount.style.setProperty('--editor-zoom', zoom);
  }

  function refreshReadAloudVoices(): void {
    if (!('speechSynthesis' in window)) {
      readAloudVoiceSelect.innerHTML = '<option value="">Read Aloud unavailable</option>';
      readAloudVoiceSelect.disabled = true;
      readAloudRateSelect.disabled = true;
      return;
    }

    availableVoices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('en'));
    let storedVoice = '';
    let storedRate = '';
    try {
      storedVoice = localStorage.getItem(READ_ALOUD_VOICE_KEY) ?? '';
      storedRate = localStorage.getItem(READ_ALOUD_RATE_KEY) ?? '';
    } catch {
      storedVoice = '';
      storedRate = '';
    }

    const preferredVoice = storedVoice || chooseFriendlyVoice(availableVoices)?.voiceURI || '';
    readAloudVoiceSelect.innerHTML = [
      '<option value="">Browser default</option>',
      ...availableVoices.map((voice) => `<option value="${escapeHtml(voice.voiceURI)}">${escapeHtml(voice.name)} (${escapeHtml(voice.lang)})</option>`),
    ].join('');
    readAloudVoiceSelect.value = availableVoices.some((voice) => voice.voiceURI === preferredVoice) ? preferredVoice : '';
    readAloudRateSelect.value = ['0.8', '0.9', '1', '1.15'].includes(storedRate) ? storedRate : '0.9';
  }

  function updateCitationPreview(): void {
    citationPreview.textContent = getCitationText() || 'Fill in the fields, then insert the citation at the cursor.';
  }
}

bootstrap();

function documentTextFromHtml(html: string): string {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function formatReadingTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function updateWarningSummary(warnings: WritingWarnings): void {
  getRequiredElement('veryHardCount').textContent = String(warnings.veryHardSentences.length);
  getRequiredElement('hardCount').textContent = String(warnings.hardSentences.length);
  getRequiredElement('passiveCount').textContent = String(warnings.passiveVoice.length);
  getRequiredElement('adverbCount').textContent = String(warnings.adverbs.length);
  getRequiredElement('alternativeCount').textContent = String(warnings.alternatives.length);
  getRequiredElement('weakCount').textContent = String(warnings.weakPhrases.length);

  const first =
    warnings.veryHardSentences[0] ??
    warnings.hardSentences[0] ??
    warnings.passiveVoice[0] ??
    warnings.adverbs[0] ??
    warnings.alternatives[0] ??
    warnings.weakPhrases[0];

  getRequiredElement('firstSuggestion').textContent = first
    ? `${labelWarning(first.kind)}: "${first.text}"${first.suggestion ? ` - ${first.suggestion}` : ''}`
    : 'No suggestions yet.';
}

function jumpToAnalysisHighlight(kind: string): void {
  const highlight = document.querySelector<HTMLElement>(`[data-analysis-kind="${kind}"]`);
  const editor = getRequiredElement<HTMLElement>('editor');

  if (!highlight) {
    return;
  }

  highlight.scrollIntoView({ block: 'center', behavior: 'smooth' });
  editor.removeAttribute('data-active-analysis-kind');
  void editor.offsetWidth;
  editor.dataset.activeAnalysisKind = kind;
  window.setTimeout(() => {
    if (editor.dataset.activeAnalysisKind === kind) {
      editor.removeAttribute('data-active-analysis-kind');
    }
  }, 900);
}

function labelWarning(kind: string): string {
  const labels: Record<string, string> = {
    'very-hard': 'Very hard sentence',
    hard: 'Hard sentence',
    passive: 'Passive voice',
    adverb: 'Adverb',
    alternative: 'Simpler word',
    weak: 'Weak phrase',
  };

  return labels[kind] ?? 'Suggestion';
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')));
    reader.addEventListener('error', () => reject(reader.error ?? new Error('Image could not be read.')));
    reader.readAsDataURL(file);
  });
}
