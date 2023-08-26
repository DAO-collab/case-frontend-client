export interface IImport {
  import_id?: string;
  name: string;
  type: string;
  source: string;
  passed?: number;
  failed?: number;
  total?: number;
  host_id?: string;
  status?: ImportStatus;
  created_on?: string;
  updated_on?: string;
}

export interface IImportItem {
  created_on: string;
  data: any;
  host_id: string;
  import_id: string;
  output?: string;
  schema_errors?: any;
  status: ImportStatus;
  type: string;
  unique_id: string;
  updated_on: string;
}

export enum ImportStatus {
  Queued = 'QUEUED',
  Processed = 'PROCESSED',
  Processing = 'PROCESSING'
}

export enum ImportsSearchAttribute {
  Name = 'name'
}
