import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { pluck } from 'rxjs/operators';

import { FormSignResponse } from '@app/interfaces/form-sign-response.interface';
import { IForms } from '../interfaces/IForms';
import { FormModel, UpdateFormModel } from '../pages/forms/models/FormModel';
import { UpdateAttendingRequest } from '../models/UpdateAttendingRequest';
import { API_URL } from '../utils/constants.utils';
import { isEmptyValue } from '../utils/utils';
import { TCurrentTabState } from './types/tab-state.type';
import { FormsPublish } from './interfaces/forms-publish.interface';

@Injectable()
export class SignsService implements IForms {
  private withCredentials = { withCredentials: true };
  private fullAuth = { withCredentials: true };
  public activeteCreateSignModal = new Subject<any>();
  public createSignModalState: Observable<string> = this.activeteCreateSignModal.asObservable();
  private openSignSub = new Subject<any>();
  public createSignCommand = this.openSignSub.asObservable();
  private signBuilderStateSubject: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  public signBuilder$: Observable<number> = this.signBuilderStateSubject.asObservable();
  private publishSignSubject: Subject<boolean> = new Subject<boolean>();
  public publishSign$: Observable<boolean> = this.publishSignSubject.asObservable();
  public dueDateSubject: Subject<string> = new Subject<string>();
  public dueDate$: Observable<string> = this.dueDateSubject.asObservable();
  public signDirectLinkSubject: Subject<{ id: string; action: string }> = new Subject();
  public refreshPinchSubject = new Subject<any>();
  public currentTab$: BehaviorSubject<TCurrentTabState> = new BehaviorSubject<TCurrentTabState>('completed');
  public isSignaturePopupOpened$ = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, private router: Router) {}

  public refreshPinch() {
    this.refreshPinchSubject.next();
  }

  public publishDueDate(dueDate: string) {
    this.dueDateSubject.next(dueDate);
  }

  public toggleSignBuilder(state: any) {
    this.signBuilderStateSubject.next(state);
  }

  public publishSign(state: any) {
    this.publishSignSubject.next(state);
  }

  public openCreateForm(type: any) {
    this.openSignSub.next(type);
  }

  public activateCreateModal() {
    this.activeteCreateSignModal.next(true);
  }

  public createForm(caseId: string, request: FormModel): Observable<{ case_id: string; sign_id: string; selfLink: string }> {
    return this.http.post(`${API_URL}/${caseId}/signs`, request, this.withCredentials).pipe(pluck('data'));
  }

  public postFormMedia(caseId: string, formId: string, mediaId: string) {
    return this.http.put(
      `${API_URL}/${caseId}/signs/media/${formId}`,
      {
        media: [{ media_key: mediaId }]
      },
      this.withCredentials
    );
  }

  public updateForm(caseId: string, request: FormModel, signId: string) {
    let signData = new UpdateFormModel(request);
    signData = {
      ...signData,
      notifications: isEmptyValue(signData.notifications) ? {} : signData.notifications
    };
    // if (isEmptyValue(signData.schema.schema.schema) && isEmptyValue(signData.schema.schema.properties)) {
    //   signData.schema = {
    //     schema: { schema: { properties: {} }}
    //   };
    // }

    return this.http.put(`${API_URL}/${caseId}/signs/${signId}/schema`, signData, this.fullAuth);
  }

  public updateFormWithoutSchema(caseId: string, request: FormModel, signId: string): Observable<FormsPublish> {
    return this.http.put<FormsPublish>(`${API_URL}/${caseId}/signs/${signId}`, request, this.withCredentials);
  }

  public getForms(caseId: string, filter: any, limit: number = 20) {
    return this.http.get(`${API_URL}/${caseId}/signs?filter=${filter}&limit=${limit}`, this.withCredentials).pipe(pluck('data'));
  }

  public deleteForm(caseId: string, eventId: string): any {
    return this.http.delete(`${API_URL}/${caseId}/signs/${eventId}`, this.withCredentials);
  }
  
  public publishFormApi(caseId: string, signId: string): Observable<FormsPublish> {
    return this.http.put<FormsPublish>(`${API_URL}/${caseId}/signs/${signId}/status`, { published: 1 }, this.withCredentials);
  }

  public getSignAnswers(caseId: string, signId: string, responseId: string): Observable<FormSignResponse['data']> {
    return this.http.get<FormSignResponse>(`${API_URL}/${caseId}/signs/${signId}/responses/${responseId}`, this.withCredentials).pipe(pluck('data'));
  }

  public getFormConfirmations(caseId: string, signId: string) {
    return this.http.get(`${API_URL}/${caseId}/signs/${signId}/responses`, this.withCredentials);
  }

  public postFormConfirmation(caseId: string, signId: string, request: UpdateAttendingRequest) {
    return this.http.post(`${API_URL}/${caseId}/signs/${signId}/responses`, request, this.withCredentials);
  }

  public deleteFormConfirmation(caseId: string, signId: string) {
    return this.http.delete(`${API_URL}/${caseId}/signs/event/answers/${signId}`, this.withCredentials);
  }

  public getLibrarySigns(caseId: string): Observable<any> {
    return this.http.get(`${API_URL}/${caseId}/signs/templates`, this.withCredentials).pipe(pluck('data'));
  }

  public getFormInfo(caseId: string, signId: string): Observable<any> {
    return this.http.get(`${API_URL}/${caseId}/signs/${signId}`, this.withCredentials).pipe(pluck('data'));
  }

  public checkRoutes() {
    return !(this.router.url.includes('doc-e-sign-builder') || this.router.url.includes('e-sign-builder'));
  }
}
