export interface Field {
  format: string;
  defaultValue: string;
  fieldType: string;
  index: number;
  meta_data: FieldMetaData;
  name: string;
  displayText: boolean;
  require: boolean;
  readonly: boolean;
  title: string;
  subText: string;
  type: string;
  items?: any;
  enum?: any;
  top: string;
  left: string;
  key: string;
  pageNumber: number;
  rows?: string[][];
  cols?: string[];
  description?: string;
  height?: string;
}

interface FieldMetaData {
  diffX: number;
  diffY: number;
  fieldName: string;
  height: number;
  left: string;
  top: string;
  width: number;
}
