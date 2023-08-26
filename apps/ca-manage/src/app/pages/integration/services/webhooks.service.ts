import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IApiGridResponse } from '../../../interfaces/api-response.model';
import { API_URL } from '../../../shared/constants.utils';
import { IWebhook } from '../models/webhook.model';
import { Observable, Subject } from 'rxjs';
import { pluck } from 'rxjs/operators';

@Injectable()
export class WebhooksService {
  private addWebhookSubject = new Subject<any>();

  activeWebhookPopUp: Observable<any> = this.addWebhookSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Show Add Webhook Modal
   */
  activateAddWebhookModal() {
    this.addWebhookSubject.next(true);
  }

  /**
   * Get webhooks list
   */
  fetchWebhooks(): Observable<IApiGridResponse<IWebhook[]>> {
    return this.http.get<IApiGridResponse<IWebhook[]>>(API_URL(`/webhooks`)).pipe(pluck('data'));
  }

  /**
   * Get webhooks list
   */
  fetchMoreWebhooks(startKey: string): Observable<IApiGridResponse<IWebhook[]>> {
    return this.http.get<IApiGridResponse<IWebhook[]>>(API_URL(`/webhooks?start_key=${startKey}`)).pipe(pluck('data'));
  }

  /**
   * Get webhook by id
   */
  getWebhook(webhookId: string): Observable<IApiGridResponse<IWebhook[]>> {
    return this.http.get<IApiGridResponse<IWebhook[]>>(API_URL(`/webhooks/${webhookId}`)).pipe(pluck('data'));
  }

  /**
   * Save webhook
   */
  saveWebhook(webhookData: IWebhook): Observable<{ private_key: string; selfLink: string }> {
    return this.http.post(API_URL(`/webhooks`), webhookData).pipe(pluck('data'));
  }

  /**
   * Update webhook
   */
  updateWebhook(webhookId: string, webhookData: IWebhook): Observable<any> {
    return this.http.put(API_URL(`/webhooks/${webhookId}`), webhookData);
  }

  /**
   * Remove webhook
   */
  removeWebhook(webhookId: string): Observable<any> {
    return this.http.delete(API_URL(`/webhooks/${webhookId}`));
  }
}
