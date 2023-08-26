// tslint:disable: variable-name
export class LogsRequest {
  domain = '';
  domain_type = '';
  end_date = '';
  start_date = '';
  filter?: any = {
    entity: '',
    entity_field_name: ''
  };
}

export class QueryRequest {
  log = '';
  whereClause? = '';
}

export interface LogsStatus {
  status?: any;
}
