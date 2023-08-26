import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { API_URL } from '../../../shared/constants.utils';
import { HttpClient } from '@angular/common/http';
import { catchError, pluck } from 'rxjs/operators';
import { IApiGridResponse } from '../../../interfaces/api-response.model';
import { IRole, RoleType, RoleSearchAttribute } from '../models/role.model';

@Injectable()
export class RolesService {
  private withCredentials = { withCredentials: true };
  private rolesFilterSubject: Subject<RoleType> = new Subject();
  public rolesFilterSub: Observable<RoleType> = this.rolesFilterSubject.asObservable();
  public subMenuItem = RoleType.System;

  constructor(private http: HttpClient) {}

  public setRolesFilter(roleType: RoleType) {
    this.rolesFilterSubject.next(roleType);
    this.subMenuItem = roleType;
  }

  /**
   * Get role by id
   * @param roleId: string
   */
  public getRole(roleId: string): Observable<IRole> {
    return this.http.get<IRole>(API_URL(`/roles/${roleId}`), this.withCredentials).pipe(pluck('data'));
  }

  /**
   * Get roles
   */
  public getRoles(): Observable<IApiGridResponse<IRole[]>> {
    return this.http.get<IApiGridResponse<IRole[]>>(API_URL('/roles'), this.withCredentials).pipe(pluck('data'));
  }

  public getMoreRoles(startKey: string): Observable<IApiGridResponse<IRole[]>> {
    return this.http
      .get<IApiGridResponse<IRole[]>>(API_URL(`/roles?start_key=${startKey}`), this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * Delete role by id
   * @param roleId: string
   */
  public deleteRole(roleId: string): Observable<any> {
    return this.http.delete(API_URL(`/roles/${roleId}`), this.withCredentials);
  }

  /**
   * Search role.
   * @param roleType: RoleType
   * @param attribute: RoleSearchAttribute
   * @param value: string
   */
  public searchRoles(attribute: RoleSearchAttribute, value: string): Observable<IApiGridResponse<IRole[]>> {
    const valueQuery = value.trim() ? '&value=' + value.trim() : '';
    return this.http
      .get<IApiGridResponse<IRole[]>>(
        API_URL(`/roles/search?attribute=${attribute}${valueQuery}`),
        this.withCredentials
      )
      .pipe(pluck('data'));
  }

  public searchMoreRoles(
    attribute: RoleSearchAttribute,
    value: string,
    startKey: string
  ): Observable<IApiGridResponse<IRole[]>> {
    const valueQuery = value.trim() ? '&value=' + value.trim() : '';

    return this.http
      .get<IApiGridResponse<IRole[]>>(
        API_URL(`/roles/search?start_key=${startKey}&attribute=${attribute}${valueQuery}`),
        this.withCredentials
      )
      .pipe(pluck('data'));
  }

  /**
   * Create role.
   * @param data: IRole
   */
  public createRole(data: IRole): Observable<any> {
    return this.http.post(API_URL('/roles'), data, this.withCredentials);
  }

  /**
   * Update role.
   * @param roleId: string
   * @param data: IRole
   */
  public updateRole(roleId: string, data: any): Observable<any> {
    return this.http.put(API_URL(`/roles/${roleId}`), data, this.withCredentials).pipe(
      catchError(res => {
        return throwError(res.error);
      })
    );
  }
}
