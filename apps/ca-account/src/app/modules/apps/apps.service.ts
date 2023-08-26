import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { pluck, shareReplay, takeUntil, tap } from 'rxjs/operators';

import { CookieService } from 'ngx-cookie-service';

import { IApp, INewApp, INewAppResponse, IPaymentCardInfo, IPaymentModel } from './app.model';
import { API_URL, HOSTS_PUBLIC_CDN_URL, MANAGE_API_URL } from '@acc/utils/constants.utils';
import { environment } from '@acc-envs/environment';
import { NotificationsService } from '../../services/notifications.service';
import { LocalTranslationService } from '../../core/local-translation.service';
import { SETTING_MODE } from './accept-invitation-modal/accept-invitation-modal.component';

@Injectable({
  providedIn: 'root'
})
export class AppsService {
  public showModal = false;
  public isJoinAppModalShowed = false;
  public isSelectOptionModalShowed = false;
  public isSelectOptionModalDisabled = false;
  public paymentError = {
    show: false,
    errorMessage: ''
  };
  public selectedApp?: IApp;
  public acceptInvitationSubject: Subject<boolean> = new Subject<boolean>();
  public joinAppModalData?: any;
  public isLogInOrSignUp = new BehaviorSubject(false);
  public selectedModalTab?: SETTING_MODE | null;
  public userApps: IApp[] = [];
  public activeAppsCount$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  unsubscribe$: Subject<void> = new Subject();

  get credentials() {
    return {
      headers: { 'X-XSRF-TOKEN': this.cookieService.get('XSRF-TOKEN') },
      withCredentials: true
    };
  }

  constructor(
    private cookieService: CookieService,
    private httpClient: HttpClient,
    private notificationsService: NotificationsService,
    private sanitizer: DomSanitizer,
    private localTranslationService: LocalTranslationService
  ) {}

  getDesignUrl = (host: string, targetName: string, ext: string, size?: string, height: string = '0'): SafeResourceUrl => {
    const url = `/${targetName}/images/${targetName}?ext=${ext}&width=${size}&height=${height}&max_age=0&t=${Math.random()}`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(HOSTS_PUBLIC_CDN_URL(url, host));
  };

  /**
   * Opens application.
   */
  public openApp(app: IApp, user_type?: string): void {
    if (app.host_granted_status === 0) {
      this.selectedApp = app;
      this.showModal = true;
      return;
    }

    let reference: string = location.host;
    let port = '';

    switch (user_type) {
      case 'a':
        reference = reference.replace(/account/g, 'manage');
        port = '4202';
        this.notificationsService
          .getManageNotifications(app.host_id)
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe(
            res => {
              location.href = environment.IS_LOCAL
                ? `http://${app.host_id}.localhost:${port}`
                : `https://${app.host_id}.${reference}`;
            },
            error => {
              if (error?.error?.error?.error_type === 'ManageBillingInactiveException') {
                this.localTranslationService.loadErrorsJSON().subscribe(() => {
                  this.paymentError.errorMessage = this.localTranslationService.errors[error.error.error.error_type];
                  this.paymentError.show = true;
                  this.selectedModalTab = SETTING_MODE.PAYMENT;

                  if (!this.paymentError.errorMessage) {
                    this.paymentError.errorMessage = 'Please enter valid payment information before proceeding';
                  }

                  this.showAppInvitationModal(app);
                });
              } else if (error?.error?.error?.message === 'UserRelationGrantedFieldsException') {
                app.host_granted_status = 0;

                this.showAppInvitationModal(app);
              }
            }
          );
        break;
      case 'c':
        reference = reference.replace(/account/g, 'app');
        port = '4203';
        location.href = environment.IS_LOCAL
          ? `http://${app.host_id}.localhost:${port}`
          : `https://${app.host_id}.${reference}`;
        break;
    }
  }

  /**
   * Show App Invitation modal
   */
  public showAppInvitationModal(app: IApp): void {
    this.selectedApp = app;
    this.showModal = true;
  }

  /**
   * Creates new application.
   */
  public createApp(app: INewApp): Observable<INewAppResponse> {
    return this.httpClient
      .post<{ data: INewAppResponse }>(API_URL('/v1/self/apps'), app, this.credentials)
      .pipe(pluck('data'));
  }

  /**
   * Gets all apps.
   */
  public findAllApps(forceUpdate?: boolean): Observable<IApp[]> {
    return this.httpClient
      .get<{ data: { items: IApp[] } }>(API_URL('/v1/self/apps'), {
        withCredentials: true,
        headers: { ...this.credentials.headers, ...(forceUpdate ? { 'x-refresh': 'true' } : {}) }
      })
      .pipe(
        pluck('data', 'items'),
        shareReplay(),
        tap(data => (this.userApps = data))
      );
  }

  /**
   * Gets apps with current status.
   */
  public findStatusApps(forceUpdate?: boolean, status?: string): Observable<IApp[]> {
    return this.httpClient
      .get<{ data: { items: IApp[] } }>(API_URL(`/v1/self/apps?status=${status}`), {
        withCredentials: true,
        headers: { ...this.credentials.headers, ...(forceUpdate ? { 'x-refresh': 'true' } : {}) }
      })
      .pipe(pluck('data', 'items'), shareReplay());
  }

  /**
   * Accepts application.
   */
  public acceptApp(host_id: string, host_granted_status: number): Observable<any> {
    return this.httpClient.put(API_URL(`/v1/self/apps/${host_id}`), { host_granted_status }, this.credentials);
  }

  public updateNotifications(host_id: string, data: any) {
    return this.httpClient.put(API_URL(`/v1/self/apps/${host_id}`), data, this.credentials);
  }

  /**
   * Join an app.
   */
  public joinApp(hostId: string): Observable<any> {
    return this.httpClient.post<{ data: any }>(API_URL(`/v1/self/apps/${hostId}`), this.credentials);
  }

  /**
   * Update Payment data
   * @param design: IPaymentCardInfo
   */
  updatePaymentCard(payload: IPaymentCardInfo, hostId: string): Observable<any> {
    return this.httpClient.put(MANAGE_API_URL(`/v1/${hostId}/payment/card`), payload, this.credentials);
  }

  /**
   * Get Payment data
   * @param design: IPaymentCardInfo
   */
  getPaymentCard(hostId: string): Observable<IPaymentModel> {
    return this.httpClient
      .get<IPaymentCardInfo>(MANAGE_API_URL(`/v1/${hostId}/payment/card`), {
        withCredentials: true
      })
      .pipe(pluck('data'));
  }
}
