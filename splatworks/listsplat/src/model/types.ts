export type FieldType =
  | 'text'
  | 'longText'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'checkbox'
  | 'rating'
  | 'choice'
  | 'image'
  | 'link'
  | 'calculation'
  | 'autoNumber'
  | 'createdAt'
  | 'updatedAt';

export interface ListSplatField {
  id: string;
  name: string;
  type: FieldType;
  description: string;
  required: boolean;
  hidden: boolean;
  options?: string[];
  formula?: string;
}

export type ListSplatCellValue = string | number | boolean | null;

export interface ListSplatRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  values: Record<string, ListSplatCellValue>;
}

export interface ListSplatTable {
  id: string;
  name: string;
  fields: ListSplatField[];
  records: ListSplatRecord[];
}

export interface ListSplatRelationship {
  id: string;
  name: string;
  fromTableId: string;
  fromFieldId: string;
  toTableId: string;
  toFieldId: string;
}

export type LayoutMode = 'table' | 'form' | 'cards' | 'gallery' | 'labels' | 'report';

export interface ListSplatLayout {
  id: string;
  name: string;
  tableId: string;
  mode: LayoutMode;
  locked: boolean;
  fieldOrder?: string[];
  hiddenFieldIds?: string[];
  columnWidths?: Record<string, number>;
}

export type FindOperator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'isEmpty'
  | 'isNotEmpty';

export interface FindRule {
  fieldId: string;
  operator: FindOperator;
  value: string;
  value2?: string;
}

export interface FindQuery {
  match: 'all' | 'any';
  rules: FindRule[];
}

export interface SortKey {
  fieldId: string;
  direction: 'asc' | 'desc';
}

export interface SavedView {
  id: string;
  name: string;
  tableId: string;
  mode: LayoutMode;
  search: string;
  searchFieldId: string;
  find: FindQuery | null;
  sortKeys: SortKey[];
}

export interface ListSplatFile {
  app: 'ListSplatTM';
  version: 1;
  createdAt: string;
  updatedAt: string;
  metadata: {
    title: string;
    author: string;
    className: string;
  };
  schema: {
    tables: ListSplatTable[];
    relationships: ListSplatRelationship[];
  };
  layouts: ListSplatLayout[];
  views?: SavedView[];
  teacher: {
    studentView: boolean;
    notes: string[];
    rubric: string[];
  };
}
