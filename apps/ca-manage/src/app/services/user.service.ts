import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../shared/constants.utils';
import { AuthStatus } from '../interfaces/auth-status.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private withCredentials = { withCredentials: true };
  private apiUrl: string;
  constructor(private http: HttpClient) {
    this.apiUrl = API_URL();
  }

  /**
   * Get Status of authentication
   */
  public getAuthStatus(): Observable<AuthStatus> {
    return this.http.get<AuthStatus>(`${this.apiUrl}/whoami`, this.withCredentials);
  }
}
