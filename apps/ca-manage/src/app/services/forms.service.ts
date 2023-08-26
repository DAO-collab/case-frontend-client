import { Injectable, ElementRef, Renderer2, RendererFactory2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { API_URL } from '../shared/constants.utils';
import { Observable, Subject } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { Router } from '@angular/router';

import { IApiGridResponse } from '../interfaces/api-response.model';
import { IMedia, FeedPostStatus } from '../pages/modules/media/models/media.model';

export enum CreateFormType {
  FormBuilder = 'builder',
  FileUpload = 'document'
}

interface ISrcRequest {
  url_key: string;
  ext: string;
  height: string;
  width: string;
}

export interface IForm {
  asset_id?: string;
  asset_type?: string;
  created_on?: string;
  updated_on?: string;
  host_id?: string;
  media?: IMedia;
  mediaId?: string;
  description?: string;
  schema?: {
    meta_data?: any;
    schema?: any;
    tabs?: any;
    properties?: any;
    type?: string;
  };
  tag_id?: string;
  due_date?: string;
  due_mins?: number;
  media_asset_id?: string;
  media_ct?: number;
  notifications?: {
    names: string[] | null;
    values: string[] | null;
  };
  permissions?: string[];
  rrule?: string;
  task?: any;
  recurring?: boolean;
  recipients_ids?: string[] | null;
  status?: FeedPostStatus;
  type?: CreateFormType;
  pages_ct?: number;
  pages?: any[];
}

export interface ICreateFormResponse {
  asset_id: string;
  host_id: string;
  selfLink: string;
}

@Injectable()
export class FormsService {
  public isFieldsDisabled = false;
  private withCredentials = { withCredentials: true };
  private apiUrl = '';
  private activeteCreateFormModal = new Subject<CreateFormType>();

  private renderer: Renderer2;
  public createFormModalState: Observable<CreateFormType> = this.activeteCreateFormModal.asObservable();
  public refreshPinchSubject = new Subject<any>();

  constructor(
    public date: DatePipe,
    private http: HttpClient,
    private router: Router,
    private rendererFactory: RendererFactory2
  ) {
    this.apiUrl = API_URL();
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  public refreshPinch() {
    this.refreshPinchSubject.next();
  }

  /**
   * Show create form modal
   * @param formType: CreateFormType
   */
  public activateCreateModal(formType: CreateFormType) {
    this.activeteCreateFormModal.next(formType);
  }

  /**
   * Create form
   * @param request: IForm
   */
  public createForm(request: IForm): Observable<ICreateFormResponse> {
    return this.http
      .post<ICreateFormResponse>(`${this.apiUrl}/forms`, request, this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * Update form
   * @param request: IForm
   * @param formId: string
   */
  public updateForm(request: IForm, formId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/forms/${formId}`, request, this.withCredentials);
  }

  /**
   * Get forms
   */
  public getForms(): Observable<IApiGridResponse<IForm[]>> {
    return this.http.get<IApiGridResponse<IForm[]>>(`${this.apiUrl}/forms`, this.withCredentials).pipe(pluck('data'));
  }

  public getMoreForms(startKey: string): Observable<IApiGridResponse<IForm[]>> {
    return this.http
      .get<IApiGridResponse<IForm[]>>(`${this.apiUrl}/forms?start_key=${startKey}`, this.withCredentials)
      .pipe(pluck('data'));
  }

  public getFormsFilter(filter: string): Observable<IApiGridResponse<IForm[]>> {
    return this.http
      .get<IApiGridResponse<IForm[]>>(`${this.apiUrl}/forms?filter=${filter}`, this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * Delete form
   * @param formId: string
   */
  public deleteForm(formId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/forms/${formId}`, this.withCredentials);
  }

  /**
   * Get form data
   * @param formId: string
   */
  public getFormInfo(formId: string): Observable<IForm> {
    return this.http.get<IForm>(`${this.apiUrl}/forms/${formId}`, this.withCredentials).pipe(pluck('data'));
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

    let mr = -element.offsetWidth / scale + element.offsetWidth;

    if (mr > 0) {
      mr = 0;
    }

    if (!scale) {
      return 1;
    }

    this.renderer.setStyle(pinchZoomWrapper.nativeElement, '-webkit-transform', `scale(${scale})`);
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

  public formatTitle(fieldList: any, id: any): string {
    if (id === 'options' || id === 'list') {
      return 'Single Choice';
    } else if (id === 'checkbox-options' || id === 'checkboxes') {
      return 'Multi Choice';
    } else {
      return fieldList.find((el: any) => el.id === id)?.text ?? '';
    }
  }
}
