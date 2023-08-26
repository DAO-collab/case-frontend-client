import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { pluck } from 'rxjs/operators';

import { API_URL } from '../utils/constants.utils';

@Injectable({ providedIn: 'root' })
export class IntakeFormService {
  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient) {}

  putIntake(request: any) {
    return this.http.put(`${API_URL}/intake`, request, this.withCredentials).pipe(pluck('data'));
  }
}
