import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, pluck } from 'rxjs/operators';

import { API_URL } from '../utils/constants.utils';

class ISchema {
  schema?: string;
}

class DataResponse {
  data?: SchemaResponse;
}

class SchemaResponse {
  case_schema = new ISchema();
  note_schema = new ISchema();
}

@Injectable({
  providedIn: 'root'
})
export class SchemaService {
  private _schema: any;

  constructor(private http: HttpClient) {}

  getSchemas(): Observable<any> {
    return this._schema
      ? of(this._schema)
      : this.http.get<any>(`${API_URL}/schemas`).pipe(
          pluck('data'),
          map(data => (this._schema = data))
        );
  }
}
