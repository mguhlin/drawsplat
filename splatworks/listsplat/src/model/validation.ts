import type { ListSplatCellValue, ListSplatField, ListSplatRecord, ListSplatTable, ValidationPattern } from './types';

const PATTERNS: Record<Exclude<ValidationPattern, 'none' | 'custom'>, RegExp> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/,
  phone: /^[+()\d][\d\s().-]{5,}$/,
};

function cellText(value: ListSplatCellValue): string {
  return value == null ? '' : String(value);
}

// Validate one cell against its field constraints. Returns an empty message when
// the value is acceptable. Validation is advisory (shown, never blocks typing).
export function validateCell(
  field: ListSplatField,
  value: ListSplatCellValue,
  table?: ListSplatTable,
  recordId?: string,
): string {
  const message = validateCellRaw(field, value, table, recordId);
  return message && field.customMessage ? field.customMessage : message;
}

function validateCellRaw(field: ListSplatField, value: ListSplatCellValue, table?: ListSplatTable, recordId?: string): string {
  const text = cellText(value).trim();
  if (text === '') {
    return field.required ? 'This field is required.' : '';
  }
  if (field.maxLength && text.length > field.maxLength) {
    return `Keep this ${field.maxLength} characters or fewer.`;
  }
  if (field.type === 'email' && !PATTERNS.email.test(text)) {
    return 'Enter a valid email address.';
  }
  if (field.type === 'phone' && !PATTERNS.phone.test(text)) {
    return 'Enter a valid phone number.';
  }
  if (['number', 'currency', 'percent', 'rating'].includes(field.type)) {
    const numeric = Number(text);
    if (Number.isNaN(numeric)) {
      return 'Enter a number.';
    }
    if (field.min != null && numeric < field.min) {
      return `Must be at least ${field.min}.`;
    }
    if (field.max != null && numeric > field.max) {
      return `Must be at most ${field.max}.`;
    }
  }
  if (['text', 'longText', 'link'].includes(field.type) && field.pattern && field.pattern !== 'none') {
    if (field.pattern === 'custom') {
      if (field.customPattern) {
        try {
          if (!new RegExp(field.customPattern).test(text)) {
            return 'Does not match the required format.';
          }
        } catch {
          // Ignore an invalid custom pattern rather than blocking entry.
        }
      }
    } else if (!PATTERNS[field.pattern].test(text)) {
      return `Enter a valid ${field.pattern}.`;
    }
  }
  if (field.unique && table) {
    const duplicate = table.records.some(
      (record) => record.id !== recordId && cellText(record.values[field.id]).trim().toLowerCase() === text.toLowerCase(),
    );
    if (duplicate) {
      return 'This value is already used in another record.';
    }
  }
  return '';
}

export function tableValidationIssues(table: ListSplatTable): Array<{ record: ListSplatRecord; field: ListSplatField; message: string }> {
  const issues: Array<{ record: ListSplatRecord; field: ListSplatField; message: string }> = [];
  table.fields.forEach((field) => {
    if (['calculation', 'autoNumber', 'createdAt', 'updatedAt', 'image'].includes(field.type)) {
      return;
    }
    table.records.forEach((record) => {
      const message = validateCell(field, record.values[field.id], table, record.id);
      if (message) {
        issues.push({ record, field, message });
      }
    });
  });
  return issues;
}
