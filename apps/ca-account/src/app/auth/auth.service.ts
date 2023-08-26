import { Inject, Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, interval, of, Subject } from 'rxjs';
import { tap, catchError, pluck, shareReplay, switchMap, filter, takeUntil } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { IApiResponse } from '../core/api-response.model';
import { IConfirmResetPasswordCredentials, IPasswordChangeCredentials } from './credentials.model';
import { IUser } from '../core/user.model';
import { Router, ActivatedRoute } from '@angular/router';
import { API_URL } from '../utils/constants.utils';
import { environment } from '@acc-envs/environment';
import { AppsService } from '../modules/apps/apps.service';
import { DOCUMENT } from '@angular/common';
import { OTP, SignUp, SignUpInfo } from './interfaces';

/**
 * Notify request model.
 */
export interface INotifyRequest {
  companyName: string;
  email: string;
  familyName: string;
  givenName: string;
  recaptcha: string;
}

// pin code request model
export interface IOptRequest {
  pin: string;
  type: 'web' | 'native';
  username: string;
}

/**
 * Authentication service.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  public isLoggedIn = false;
  public initialLoading$ = new BehaviorSubject<boolean>(true);
  public redirectUrl = this.route.snapshot.queryParams['redirectUrl'] || '/';
  public redirectApp = this.route.snapshot.queryParams['redirectApp'];
  public signUpInfo: SignUpInfo = { email: '', pin: null, sessionType: '', redirectToEnterCode: false };

  private authListener = new BehaviorSubject<boolean>(false);
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private router: Router,
    private route: ActivatedRoute,
    private appsService: AppsService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.startStorageListening();

    interval(5000)
      .pipe(
        filter(() => !this.router.url.includes('login')),
        switchMap(() => this.getCurrentUser(true)),
        catchError(err => {
          this.router.navigateByUrl('login');
          return of(err);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  public ngOnDestroy(): void {
    this.stopStorageListening();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Sends user notification.
   */
  public sendUsersNotification(data: INotifyRequest): Observable<any> {
    return this.http.post(API_URL('/v1/prospects'), data);
  }

  /**
   * Registers user.
   */
  public signup(data: SignUp): Observable<any> {
    return this.http
      .post<any>(API_URL('/v1/users'), data, {
        headers: {
          'access-control-allow-headers': 'content-type'
        },
        withCredentials: true
      })
      .pipe(
        tap(() => {
          this.isAuthenticated(true);
          this.redirectToSavedUrl();

          if (this.appsService.joinAppModalData) {
            this.appsService.isJoinAppModalShowed = true;
          }

          this.appsService.isLogInOrSignUp.next(false);
        })
      );
  }

  // send 6 digits code to email or phone
  public sendPinCode(username: { username: string }): Observable<OTP> {
    return this.http.post<OTP>(API_URL('/v1/otp'), username, {
      headers: {
        'access-control-allow-headers': 'content-type'
      },
      withCredentials: true
    });
  }

  // request when user insert his code
  public confirmPinCode(data: IOptRequest): Observable<IApiResponse> {
    return this.http
      .put<IApiResponse>(API_URL('/v1/otp'), data, {
        headers: {
          'access-control-allow-headers': 'content-type'
        },
        withCredentials: true
      })
      .pipe(
        tap(() => {
          // if (this.redirectUrl.includes('logout')) {
          //   this.redirectUrl = '/apps';
          // }
          this.isAuthenticated(true);
          this.redirectToSavedUrl();

          if (this.appsService.joinAppModalData) {
            this.appsService.isJoinAppModalShowed = true;
          }

          this.appsService.isLogInOrSignUp.next(false);
        })
      );
  }

  /**
   * Logs in user.
   */
  public login(username: string, password: string): Observable<null> {
    return this.http
      .post<null>(
        API_URL('/v1/session'),
        { username, password, type: 'web' },
        {
          headers: {
            'Access-Control-Allow-Headers': 'Content-Type'
          },
          withCredentials: true
        }
      )
      .pipe(
        tap(() => {
          // if (this.redirectUrl.includes('logout')) {
          //   this.redirectUrl = '/apps';
          // }
          this.isAuthenticated(true);
          this.redirectToSavedUrl();
        })
      );
  }

  /**
   * Logs out user.
   */
  public logout(): Observable<object> {
    return this.http.delete(API_URL('/v1/self/session')).pipe(
      tap(() => {
        this.isAuthenticated(false);
        this.router.navigateByUrl('login');
      })
    );
  }

  /**
   * Changes user password.
   */
  public changePassword(data: Partial<IPasswordChangeCredentials>): Observable<IApiResponse> {
    return this.http.put<{ data: IApiResponse }>(API_URL('/v1/self/password'), data).pipe(pluck('data'));
  }

  /**
   * Sends email to the user with a recovery code.
   */
  public resetPassword(username: string): Observable<IApiResponse> {
    return this.http
      .post<{ data: IApiResponse }>(
        API_URL('/v1/recovery'),
        { username },
        {
          headers: {
            'X-XSRF-TOKEN': this.cookieService.get('XSRF-TOKEN')
          }
        }
      )
      .pipe(pluck('data'));
  }

  /**
   * Resets user password.
   */
  public confirmResetPassword(data: IConfirmResetPasswordCredentials): Observable<IApiResponse> {
    return this.http.put<{ data: IApiResponse }>(API_URL('/v1/recovery'), data).pipe(pluck('data'));
  }

  /**
   * Remove Avatar.
   */
  public removeAvatar() {
    return this.http.delete<{ data: IApiResponse }>(API_URL('/v1/self/avatar')).pipe(pluck('data'));
  }

  /**
   * Get authenticated user.
   */
  public getCurrentUser(forceUpdate?: boolean): Observable<IUser> {
    return this.http
      .get<{ data: IUser }>(
        API_URL('/v1/self'),
        forceUpdate
          ? {
              headers: {
                'x-refresh': 'true'
              }
            }
          : {}
      )
      .pipe(pluck('data'), shareReplay());
  }

  /**
   * Authentication listener.
   */
  public authStatusListener(): Observable<IUser> {
    return this.getCurrentUser().pipe(
      catchError(error => {
        this.isAuthenticated(false);
        this.initialLoading$.next(false);
        return throwError(error);
      }),
      tap(user => {
        if (!user) {
          this.isAuthenticated(false);
        }

        this.isAuthenticated(true);
        this.redirectToSavedUrl();
        this.initialLoading$.next(false);
      })
    );
  }

  /**
   * Returns authentication status.
   */
  public get isLoggedIn$(): Observable<boolean> {
    return this.authListener.asObservable().pipe(shareReplay());
  }

  /**
   * Helper method.
   */
  private isAuthenticated(value: boolean) {
    this.isLoggedIn = value;
    this.authListener.next(value);
  }

  private redirectToSavedUrl() {
    const redirectApp = this.route.snapshot.queryParams['redirectApp'];

    if (this.redirectApp || redirectApp) {
      location.href = `http${environment.IS_LOCAL ? '' : 's'}://${this.redirectApp ? this.redirectApp : redirectApp}`;
    } else {
      this.router.navigateByUrl(this.redirectUrl);
    }
  }

  /**
   * Unsubscribe from company email
   */
  public unsubscribeFromEmail(data: any) {
    return this.http.post(API_URL('/v1/unsubscribe'), data, {
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      withCredentials: true
    });
  }

  public setTourCompleted(): Observable<{ tour_completed: true }> {
    return this.getCurrentUser().pipe(
      switchMap(() =>
        this.http.put<{ tour_completed: true }>('https://develop-api-account.caseactive.net/v1/self', {
          tour_completed: true
        })
      )
    );
  }

  // Bind the eventListener
  private startStorageListening(): void {
    this.document.defaultView?.addEventListener('storage', this.storageEventListener.bind(this));
  }

  // Logout only when key is 'logout-event'
  private storageEventListener(event: StorageEvent): void {
    if (event.storageArea == localStorage) {
      if (event?.key && event.key == 'logout-event') {
        this.router.navigateByUrl('login');
      }
    }
  }

  private stopStorageListening(): void {
    this.document.defaultView?.removeEventListener('storage', this.storageEventListener.bind(this));
  }
}
