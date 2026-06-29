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

export interface ListSplatLayout {
  id: string;
  name: string;
  tableId: string;
  mode: 'table' | 'form' | 'cards' | 'gallery' | 'labels' | 'report';
  locked: boolean;
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
  teacher: {
    studentView: boolean;
    notes: string[];
    rubric: string[];
  };
}
