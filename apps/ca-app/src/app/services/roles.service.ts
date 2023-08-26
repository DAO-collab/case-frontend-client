import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../utils/constants.utils';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { RoleNames } from '@app/interfaces';

@Injectable()
export class RolesService {
  private rolesGetSubject = new Subject<RoleNames[]>();
  public rolesGetSub: Observable<RoleNames[]> = this.rolesGetSubject.asObservable();
  public get rolesList(): RoleNames[] {
    return this._roles;
  }
  public set rolesList(roles) {
    this._roles = roles;
  }

  private withCredentials = { withCredentials: true };
  private _roles: RoleNames[] = [];

  constructor(private http: HttpClient) {}

  public getRolesList(): Observable<void> {
    return this.http.get<{ data: { items: RoleNames[]}}>(`${API_URL}/roles`, this.withCredentials).pipe(
      map((res) => {
        this.rolesList = res.data.items;
        this.rolesGetSubject.next(this.rolesList);
      })
    );
  }
}
