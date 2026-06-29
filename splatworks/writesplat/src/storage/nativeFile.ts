export interface WriteSplatFile {
  app: 'WriteSplatTM';
  version: 1;
  createdAt: string;
  updatedAt: string;
  metadata: {
    title: string;
    author: string;
    targetGrade: string;
  };
  document: WriteSplatDocument;
  teacher: {
    studentView: boolean;
    citations: string[];
    answerKey: string[];
  };
}

export type WriteSplatDocument =
  | {
      format: 'prosemirror-json';
      content: unknown;
    }
  | {
      format: 'html';
      body: string;
    };

export function createNativeFile(
  title: string,
  content: unknown,
  options: {
    answerKey?: string[];
    author?: string;
    citations?: string[];
    createdAt?: string;
    studentView?: boolean;
    targetGrade?: string;
  } = {},
): WriteSplatFile {
  const now = new Date().toISOString();

  return {
    app: 'WriteSplatTM',
    version: 1,
    createdAt: options.createdAt ?? now,
    updatedAt: now,
    metadata: {
      title: title.trim() || 'Untitled Document',
      author: options.author?.trim() ?? '',
      targetGrade: options.targetGrade ?? '6',
    },
    document: {
      format: 'prosemirror-json',
      content,
    },
    teacher: {
      studentView: options.studentView ?? false,
      citations: options.citations ?? [],
      answerKey: options.answerKey ?? [],
    },
  };
}

export function assertWriteSplatFile(value: unknown): asserts value is WriteSplatFile {
  if (!value || typeof value !== 'object') {
    throw new Error('The file is not a readable WriteSplatTM file.');
  }

  const candidate = value as Partial<WriteSplatFile>;

  if (candidate.app !== 'WriteSplatTM' || candidate.version !== 1) {
    throw new Error('This is not a supported WriteSplatTM file.');
  }

  if (!candidate.metadata || typeof candidate.metadata.title !== 'string') {
    throw new Error('This WriteSplatTM file is missing document metadata.');
  }

  if (typeof candidate.metadata.author !== 'string') {
    candidate.metadata.author = '';
  }

  if (typeof candidate.metadata.targetGrade !== 'string') {
    candidate.metadata.targetGrade = '6';
  }

  if (!candidate.document) {
    throw new Error('This WriteSplatTM file does not contain a readable document.');
  }

  if (candidate.document.format === 'html' && typeof candidate.document.body === 'string') {
    return;
  }

  if (candidate.document.format === 'prosemirror-json' && 'content' in candidate.document) {
    return;
  }

  throw new Error('This WriteSplatTM file does not contain a readable document.');
}
