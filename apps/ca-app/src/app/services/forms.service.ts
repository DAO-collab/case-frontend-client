import { ElementRef, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { pluck } from 'rxjs/operators';

import { FormSignResponse } from '@app/interfaces/form-sign-response.interface';
import { isEmptyValue } from '../utils/utils';
import { IForms } from '../interfaces/IForms';
import { FormModel, UpdateFormModel } from '../pages/forms/models/FormModel';
import { UpdateAttendingRequest } from '../models/UpdateAttendingRequest';
import { API_URL, PRIVATE_CDN_URL } from '../utils/constants.utils';
import { TCurrentTabState } from './types/tab-state.type';
import { FormsPublish } from './interfaces/forms-publish.interface';

@Injectable()
export class FormsService implements IForms {
  public isFieldsDisabled = false;
  public activeteCreateFormModal = new Subject<any>();
  public createFormModalState: Observable<string> = this.activeteCreateFormModal.asObservable();
  private withCredentials = { withCredentials: true };
  private openFormSub = new Subject<any>();
  public createFormCommand = this.openFormSub.asObservable();
  private formBuilderStateSubject: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  public formBuilder$: Observable<number> = this.formBuilderStateSubject.asObservable();
  private publishFormSubject: Subject<boolean> = new Subject<boolean>();
  public publishForm$: Observable<boolean> = this.publishFormSubject.asObservable();
  public dueDateSubject: Subject<string> = new Subject<string>();
  public dueDate$: Observable<string> = this.dueDateSubject.asObservable();
  public formDirectLinkSubject: Subject<{ id: string; action: string } | any> = new Subject();
  public refreshPinchSubject = new Subject<any>();
  public currentTab$: BehaviorSubject<TCurrentTabState> = new BehaviorSubject<TCurrentTabState>('completed');
  public isSignaturePopupOpened$ = new BehaviorSubject<any>(null);

  private renderer: Renderer2;

  constructor(private http: HttpClient, private rendererFactory: RendererFactory2, private router: Router) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  public refreshPinch() {
    this.refreshPinchSubject.next();
  }

  public publishDueDate(dueDate: string) {
    this.dueDateSubject.next(dueDate);
  }

  public toggleFormBuilder(state: any) {
    this.formBuilderStateSubject.next(state);
  }

  public publishForm(state: any) {
    this.publishFormSubject.next(state);
  }

  public openCreateForm(type: any) {
    this.openFormSub.next(type);
  }

  public activateCreateModal() {
    this.activeteCreateFormModal.next(true);
  }

  public createForm(caseId: string, request: FormModel): Observable<{ case_id: string; form_id: string; selfLink: string }> {
    return this.http.post(`${API_URL}/${caseId}/forms`, request, this.withCredentials).pipe(pluck('data'));
  }

  public postFormMedia(caseId: string, formId: string, mediaId: string) {
    return this.http.put(
      `${API_URL}/${caseId}/forms/media/${formId}`,
      {
        media: [{ media_key: mediaId }]
      },
      this.withCredentials
    );
  }

  public updateForm(caseId: string, request: FormModel, formId: string) {
    let formData = new UpdateFormModel(request);
    formData = {
      ...formData,
      notifications: isEmptyValue(formData.notifications) ? null : formData.notifications,
      participants_ids: formData.participants_ids ? formData.participants_ids : null
    };
    if (
      formData.schema &&
      formData.schema.schema &&
      isEmptyValue(formData.schema.schema.schema) &&
      isEmptyValue(formData.schema.schema.properties)
    ) {
      formData.schema = {
        schema: { schema: { properties: {} } }
      };
    }

    return this.http.put(`${API_URL}/${caseId}/forms/${formId}/schema`, formData, this.withCredentials);
  }

  public updateFormWithoutSchema(caseId: string, request: FormModel, formId: string): Observable<FormsPublish> {
    return this.http.put<FormsPublish>(`${API_URL}/${caseId}/forms/${formId}`, request, this.withCredentials);
  }

  public getForms(caseId: string, filter: number, limit: number = 20) {
    return this.http.get(`${API_URL}/${caseId}/forms?filter=${filter}&limit=${limit}`, this.withCredentials).pipe(pluck('data'));
  }

  public deleteForm(caseId: string, eventId: string) {
    return this.http.delete(`${API_URL}/${caseId}/forms/${eventId}`, this.withCredentials);
  }

  public publishFormApi(caseId: string, formId: string): Observable<FormsPublish> {
    return this.http.put<FormsPublish>(`${API_URL}/${caseId}/forms/${formId}/status`, { published: 1 }, this.withCredentials);
  }

  public getFormAnswers(caseId: string, formId: string, responseId: string): Observable<FormSignResponse['data']> {
    return this.http.get<FormSignResponse>(`${API_URL}/${caseId}/forms/${formId}/responses/${responseId}`, this.withCredentials).pipe(pluck('data'));
  }

  public getFormConfirmations(caseId: string, formId: string) {
    return this.http.get(`${API_URL}/${caseId}/forms/${formId}/responses`, this.withCredentials);
  }

  public postFormConfirmation(caseId: string, formId: string, request: UpdateAttendingRequest) {
    return this.http.post(`${API_URL}/${caseId}/forms/${formId}/responses`, request, this.withCredentials);
  }

  public deleteFormConfirmation(caseId: string, formId: string) {
    return this.http.delete(`${API_URL}/${caseId}/forms/event/answers/${formId}`, this.withCredentials);
  }

  public getFormInfo(caseId: string, formId: string): Observable<any> {
    return this.http.get(`${API_URL}/${caseId}/forms/${formId}`, this.withCredentials).pipe(pluck('data'));
  }

  public getLibraryForms(caseId: string): Observable<any> {
    return this.http.get(`${API_URL}/${caseId}/forms/templates`, this.withCredentials).pipe(pluck('data'));
  }

  public createFormFromLibrary(caseId: string, formItem: string) {
    return this.http.post(`${API_URL}/${caseId}/forms`, formItem, this.withCredentials).pipe(pluck('data'));
  }

  public getJSON(path: string): Observable<any> {
    return this.http.get(`${PRIVATE_CDN_URL}/${path}`, this.withCredentials);
  }

  public scaleBuilder(pinchZoomWrapper: ElementRef, element: any): number {
    this.renderer.setStyle(pinchZoomWrapper.nativeElement, '-webkit-transform', `scale(1)`);
    this.renderer.setStyle(pinchZoomWrapper.nativeElement.querySelector('pinch-zoom'), 'width', `100%`);
    this.renderer.setStyle(pinchZoomWrapper.nativeElement.querySelector('pinch-zoom'), 'overflow', `visible`);

    const defaultHeight = element.naturalHeight,
      defaultWidth = element.offsetWidth,
      scaleWidth = element.offsetWidth / defaultWidth,
      scaleHeight = element.offsetHeight / defaultHeight,
      scale = Math.min(scaleWidth, scaleHeight),
      width = element.offsetWidth / scale;

    let pageMultiplier = 1;
    if (window.innerHeight > 1250) {
      pageMultiplier = 1.15;
    }

    if (window.innerHeight > 1420) {
      pageMultiplier = 1.20;
    }
  
    let mr = (-element.offsetWidth / scale + element.offsetWidth * pageMultiplier);
    if (mr > 0) {
      mr = 0;
    }

    if (!scale) {
      return 1;
    }

    this.renderer.setStyle(pinchZoomWrapper.nativeElement, '-webkit-transform', `scale(${scale * pageMultiplier})`);
    this.renderer.setStyle(pinchZoomWrapper.nativeElement, '-webkit-transform-origin', `0 0`);
    this.renderer.setStyle(pinchZoomWrapper.nativeElement.querySelector('pinch-zoom'), 'width', `${width}px`);
    this.renderer.setStyle(pinchZoomWrapper.nativeElement.querySelector('pinch-zoom'), 'margin-right', `${mr}px`);

    return scale;
  }

  public refreshScale(pinchZoomWrapper: ElementRef): void {
    this.renderer.setStyle(pinchZoomWrapper.nativeElement, '-webkit-transform', `scale(1)`);
    this.renderer.setStyle(pinchZoomWrapper.nativeElement.querySelector('pinch-zoom'), 'width', `100%`);
    this.renderer.setStyle(pinchZoomWrapper.nativeElement.querySelector('pinch-zoom'), 'margin-right', `0px`);
  }

  public zoomIn(pinchZoomWrapper: ElementRef, backHeight: number, isZoomIn?: Boolean): void {
    if (isZoomIn)
      this.renderer.setStyle(
        pinchZoomWrapper.nativeElement.querySelector('pinch-zoom'),
        'margin-top',
        `${backHeight / 2}px`
      );
    else this.renderer.setStyle(pinchZoomWrapper.nativeElement.querySelector('pinch-zoom'), 'margin-top', `0px`);
  }

  public checkRoutes() {
    return !(this.router.url.includes('forms/form-builder') || this.router.url.includes('forms/doc-form-builder'));
  }

  public formatTitle(fieldList: any[], id: string): string {
    if (id === 'options' || id === 'list') {
      return 'Single Choice';
    } else if (id === 'checkbox-options' || id === 'checkboxes') {
      return 'Multi Choice';
    } else {
      return fieldList.find(el => el.id === id)?.text ?? '';
    }
  }
}
