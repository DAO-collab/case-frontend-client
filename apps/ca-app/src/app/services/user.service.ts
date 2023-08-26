import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of, ReplaySubject, Subject, throwError } from 'rxjs';
import { CasePermissions, TeamInfo, Todos, WhoAmIResponse, WhoAmI } from '@app/interfaces';
import { TeamDataRespones } from '../models/TeamDataRespones';
import { environment } from '../../environments/environment';
import { API_URL, PUBLIC_CDN_URL } from '../utils/constants.utils';
import { catchError, map, pluck } from 'rxjs/operators';

@Injectable()
export class UserService {
  private withCredentials = { withCredentials: true };
  public userData!: WhoAmI;
  public rolesPermissions: any = {};
  public teamData?: TeamDataRespones;
  public permissionsData?: TeamDataRespones;
  public userInfoSubject = new Subject<any>();
  public teamInfoSubject = new ReplaySubject<{ items: TeamInfo['data']['items'] } | null>(1);
  public permissionsSubject = new Subject<any>();
  public casePermissionsSubject = new Subject<CasePermissions['data']>();
  public casePermissionsData?: CasePermissions['data'];
  public openToDosMobile: Subject<void> = new Subject<void>();

  public currentFormsPermissions: string[] = [];
  public currentSignsPermissions: string[] = [];
  public getUserData: Observable<any> = this.userInfoSubject.asObservable();
  public getTeamData: Observable<{ items: TeamInfo['data']['items'] } | null> = this.teamInfoSubject.asObservable();
  public getPermissionsData: Observable<any> = this.permissionsSubject.asObservable();
  public getCasePermissionsData: Observable<CasePermissions['data']> = this.casePermissionsSubject.asObservable();

  private _notesPermissions: any = {};

  get notesPermissions() {
    return this._notesPermissions;
  }

  constructor(private http: HttpClient) {}

  getAvatarUrl(size: number, othersUserPicData?: any) {
    const picData = othersUserPicData || (this.userData && this.userData.picture);
    const picture = picData && picData.picture;

    if (picture) {
      return `${PUBLIC_CDN_URL}/${picture.display_start
        .replace('${display_size}', size)
        .replace('${display_format}', picture.display_formats[0])
        .replace('avatar/avatar', 'avatar/' + this.userData?.picture.uuid + '-avatar')}`;
    } else {
      const source = othersUserPicData || this.userData;

      return `${PUBLIC_CDN_URL}/users/${source.user_id}/avatar/images/avatar?ext=png&width=${size}&height=0&max_age=0`;
    }
  }

  getUserAvatar(size: number, userId: string): string {
    return `${PUBLIC_CDN_URL}/users/${userId}/avatar/images/avatar?ext=png&width=${size}&height=0&max_age=0`;
  }

  /**
   * Get Status of authentication
   */
  public getAuthStatus(): Observable<WhoAmIResponse> {
    return this.http.get<WhoAmIResponse>(`${API_URL}/whoami`, this.withCredentials);
  }

  public getPossibleVariable(caseId: string): Observable<any> {
    return this.http.get(`${API_URL}/${caseId}/whoami`, this.withCredentials);
  }

  /**
   * Get Status case permissions
   */
  public getCasePermissions(caseId: string): Observable<CasePermissions['data']> {
    return this.http.get<CasePermissions>(`${API_URL}/${caseId}/whoami`, this.withCredentials).pipe(
      map((res: CasePermissions) => {
        const jsn = res.data;

        this.casePermissionsData = jsn;
        this.currentFormsPermissions = [];
        this.currentSignsPermissions = [];
        this.currentFormsPermissions = jsn.role.permissions.forms;
        this.currentSignsPermissions = jsn.role.permissions.signs;
        this.casePermissionsSubject.next(jsn);
        this._notesPermissions = {};

        if (jsn.role.permissions.notes) {
          jsn.role.permissions.notes.forEach((permissionName: string) => (this._notesPermissions[permissionName] = true));
        }

        return jsn;
      })
    );
  }

  /**
   * Get Team Info
   */
  public getTeam(caseId: string): Observable<void> {
    return this.http.get<TeamInfo>(`${API_URL}/${caseId}/team`, this.withCredentials).pipe(
      catchError(err => {
        this.teamInfoSubject.next(null);

        return throwError(err);
      }),
      pluck('data'),
      map(({ items }) => this.teamInfoSubject.next({ items: items?.filter((item: any) => item.host_user_status) }))
    );
  }

  /**
   * Get ToDos
   */
  public getToDos(caseId: string, filter: string): Observable<Todos> {
    return this.http.get<Todos>(`${API_URL}/${caseId}/todo?filter=${filter}`, this.withCredentials);
  }

  /**
   * Get Permissions Info
   */
  public updatePermissionsData(caseId: string) {
    const observable = this.rolesPermissions[caseId]
      ? of(this.rolesPermissions[caseId])
      : this.http.get(`${API_URL}/${caseId}/roles/role/permissions`, this.withCredentials);

    return observable.pipe(
      map((res: any) => {
        this.rolesPermissions[caseId] = res;
        this.permissionsSubject.next(res.data);

        return res.data;
      })
    );
  }

  public useExistingPermission(permissions: any) {
    this.permissionsSubject.next(permissions);

    return permissions;
  }

  /**
   * updateUserData is updating user's information object
   */
  public updateUserData(data: any) {
    this.userData = data;
    this.userInfoSubject.next(this.userData);
  }
}

/**
 * AlwaysAuthGuard - class which provides GUARD for routing
 * - it protects from accessing route when user didn't logged in yet
 */
@Injectable()
export class AlwaysAuthGuard implements CanActivate {
  public authorized = false;

  private whoamiData: Subject<any> = new Subject<any>();
  private userInfoObj?: any;
  private subscribers = [];

  constructor(private router: Router, private userService: UserService) {}

  authSub = this.whoamiData.asObservable();

  destroySubscribers() {
    this.subscribers.map((s: any) => s.unsubscribe());
  }

  canActivate(): Promise<boolean> {
    return new Promise(resolve => {
      if (!this.authorized) {
        this.userService
          .getAuthStatus()
          .pipe(
            map(userInfo => {
              // Pass user data to User Service Class
              this.userService.updateUserData(userInfo.data);
              this.userInfoObj = userInfo.data;
              this.whoamiData.next(this.userInfoObj);
              resolve(true);
              this.authorized = true;

              if (this.userInfoObj.intake_pages?.length) {
                this.router.navigate(['intake-forms']);
              }
            }),
            catchError(err => {
              if (err.error && err.error.error && (err.error.error.code === 401 || err.error.error.code === 403)) {
                if (err.error.error.message === 'UserRelationStatusException') {
                  const hostname = location.hostname.split('.')[0];

                  location.href = `${environment.ACCOUNT_CLIENT_URL}?needAccess=${hostname}`;
                } else if (err.error.error.message === 'Unauthorized') {
                  if (location.search) {
                    const pathname = location.pathname.replace('/', '');

                    location.href = `${environment.ACCOUNT_CLIENT_URL}?redirectApp=${
                      location.host
                    }/${pathname}${encodeURIComponent(location.search)}`;
                    // when testing in localhost:
                    // location.href = `http://localhost:4201/login?redirectApp=${location.host}/${pathname}${encodeURIComponent(location.search)}`;
                  } else {
                    location.href = `${environment.ACCOUNT_CLIENT_URL}?redirectApp=${location.host}`;
                  }
                } else if (err.error.error.message === 'UserRelationGrantedFieldsException') {
                  const startIndex = location.host.indexOf('ca-') + 3;
                  const endIndex = location.host.indexOf('.');
                  const path = location.host.slice(startIndex, endIndex);

                  location.href = `${environment.ACCOUNT_CLIENT_URL}?reconfirmInvitation=${path}`;
                } else {
                  location.href = `${environment.ACCOUNT_CLIENT_URL}`;
                }
              }

              resolve(false);
              this.authorized = false;
              return throwError(err);
            })
          )
          .subscribe();
      } else {
        resolve(true);
        this.userService.updateUserData(this.userInfoObj);
      }
    });
  }
}
