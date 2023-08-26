import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IUser, UsernameType, UserSearchAttribute, UserType, UserLimit, UserStatus } from '../models/user.model';
import { IApiGridResponse } from '../../../interfaces/api-response.model';
import { API_URL } from '../../../shared/constants.utils';
import { Observable, Subject } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { IUserCase } from '../models/user-case.interface';

@Injectable()
export class UsersService {
  public userType = UserType.User;
  public userStatus = UserStatus.Active;
  public userLimit = UserLimit.Limit;
  public usersFilterSubject = new Subject<UserStatus>();
  public usersFilterSub: Observable<UserStatus> = this.usersFilterSubject.asObservable();
  public noUsersSubject = new Subject<any>();
  public noUsersSub: Observable<any> = this.noUsersSubject.asObservable();
  public activateAddUserToHostModalSubject = new Subject<boolean>();
  public activateAddUserToHostModalSub: Observable<boolean> = this.activateAddUserToHostModalSubject.asObservable();

  private withCredentials = { withCredentials: true };

  get userTypeQuery() {
    return this.userType === UserType.Manager ? 'manage' : this.userType;
  }

  get userStatusQuery() {
    return this.userStatus === UserStatus.Active ? 1 : 0;
  }

  constructor(private http: HttpClient) {}

  /**
   * Activate Add User To Host Modal
   */
  public activateAddUserToHostModal() {
    this.activateAddUserToHostModalSubject.next(true);
  }

  /**
   * Tell app.component that no users found
   */
  public noUsers() {
    this.noUsersSubject.next();
  }

  /**
   * Set Users Filter
   * @param userStatus: userStatus
   */
  public setUsersFilter(userStatus: UserStatus) {
    this.usersFilterSubject.next(userStatus);
  }

  /**
   * Create user relation
   * @param data: IUser
   */
  public createUserRelation(data: IUser): Observable<{ host_id: string; selfLink: string; user_id: string }> {
    return this.http
      .post<{ host_id: string; selfLink: string; user_id: string }>(API_URL('/users/relations'), data)
      .pipe(pluck('data'));
  }

  /**
   * Get user list
   */
  public fetchUsers(): Observable<IApiGridResponse<IUser[]>> {
    return this.http
      .get<IApiGridResponse<IUser[]>>(API_URL(`/users/relations/?type=${this.userStatusQuery}`))
      .pipe(pluck('data'));
  }

  /**
   * Get user list more
   */
  public fetchMoreUsers(startKey: string): Observable<IApiGridResponse<IUser[]>> {
    return this.http
      .get<IApiGridResponse<IUser[]>>(API_URL(`/users/relations/?start_key=${startKey}&type=${this.userStatusQuery}`))
      .pipe(pluck('data'));
  }

  /**
   * Search users
   * @param attribute: UserSearchAttribute | UsernameType
   * @param username?: string
   */
  public searchUsers(
    attribute: UserSearchAttribute | UsernameType,
    username?: string
  ): Observable<IApiGridResponse<IUser[]>> {
    const valueQuery = username ? `&value=${username.trim().replace('+', '%2B')}` : `&value=''`;

    return this.http
      .get<IApiGridResponse<IUser[]>>(API_URL(`/users/relations/search?attribute=${attribute}${valueQuery}`))
      .pipe(pluck('data'));
  }

  /**
   * Get user all
   */
  public getUsers(): Observable<IUser> {
    return this.http.get<IUser>(API_URL(`/users/relations`)).pipe(pluck('data'));
  }

  /**
   * Get user by id
   * @param userId: string
   */
  public getUserRelation(userId: string): Observable<IUser> {
    return this.http.get<IUser>(API_URL(`/users/relations/${userId}`)).pipe(pluck('data'));
  }

  /**
   * Remove user from app by id
   * @param userId: string
   */
  public removeUserRelation(userId: string): Observable<any> {
    return this.http.delete(API_URL(`/users/relations/${userId}`));
  }

  /**
   * Update user data
   * @param userId: string
   * @param data: IUser
   */
  public updateUserRelation(userId: string, data: IUser): Observable<any> {
    return this.http.put(API_URL(`/users/relations/${userId}`), data);
  }

  /**
   * Get cases by userId
   * @param userId: string
   */
  public getCaseByUserId(userId: string): Observable<IUserCase[]> {
    return this.http.get<any>(API_URL(`/users/relations/${userId}/cases`)).pipe(
      pluck('data'),
      map((data: { items: IUserCase[] }) =>
        data.items.map(item => ({
          ...item,
          case_role_id: item.case_role_id.split('::')[1]
        }))
      )
    );
  }

  /**
   * Delete Case Relation - delete related to case user
   * @param caseId: string
   * @param userId: string
   */
  public deleteCaseRelation(caseId: string, userId: string): Observable<any> {
    return this.http.delete(API_URL(`/cases/permissions/${caseId}/${userId}`), this.withCredentials);
  }
}
