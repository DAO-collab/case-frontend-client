import { Injectable, ElementRef, Renderer2, RendererFactory2 } from '@angular/core';
import { Observable, Subject } from 'rxjs/index';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_URL } from '../shared/constants.utils';
import { pluck } from 'rxjs/operators';
import { CreateFormType } from './forms.service';
import { IApiGridResponse } from '../interfaces/api-response.model';
import { FeedPostStatus } from '../pages/modules/media/models/media.model';

export interface ISign {
  asset_id?: string;
  asset_type?: string;
  created_on?: string;
  updated_on?: string;
  host_id?: string;
  media?: {
    audios: any;
    docs: any;
    files: any;
    images: any;
    videos: any;
  };
  description: string;
  schema?: {
    meta_data?: any;
    schema?: any;
    tabs?: any;
    properties?: any;
    type?: string;
  };
  tag_id?: string;
  due_date?: string;
  media_asset_id?: string;
  media_ct?: number;
  notifications?: {
    names: string[];
    values: string[];
  };
  permissions?: string[];
  rrule?: string;
  task?: any;
  recurring?: boolean;
  start_time?: number;
  end_time?: number;
  sign_id?: string;
  status?: FeedPostStatus;
  type?: CreateFormType;
}

export interface ICreateSignResponse {
  asset_id: string;
  host_id: string;
  selfLink: string;
}

@Injectable()
export class SignsService {
  public isFieldsDisabled = false;
  private withCredentials = { withCredentials: true };
  private apiUrl = '';

  public activeteCreateSignModal = new Subject<CreateFormType>();
  public createSignModalState: Observable<CreateFormType> = this.activeteCreateSignModal.asObservable();
  private renderer: Renderer2;
  public refreshPinchSubject = new Subject<any>();

  constructor(private http: HttpClient, private router: Router, private rendererFactory: RendererFactory2) {
    this.apiUrl = API_URL();
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  public refreshPinch() {
    this.refreshPinchSubject.next();
  }

  /**
   * Show Create Sign Modal
   * @param type: CreateFormType
   */
  public activateCreateModal(type: CreateFormType) {
    this.activeteCreateSignModal.next(type);
  }

  /**
   * Create sign
   * @param data: ISign
   */
  public createSign(data: ISign): Observable<ICreateSignResponse> {
    return this.http.post<ICreateSignResponse>(`${this.apiUrl}/signs`, data, this.withCredentials).pipe(pluck('data'));
  }

  /**
   * Update sign.
   * @param request: ISign
   * @param signId: string
   */
  public updateForm(request: ISign, signId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/signs/${signId}`, request, this.withCredentials);
  }

  /**
   * Get signs
   */
  public getSigns(): Observable<IApiGridResponse<ISign[]>> {
    return this.http.get<IApiGridResponse<ISign[]>>(`${this.apiUrl}/signs`, this.withCredentials).pipe(pluck('data'));
  }

  public getMoreSigns(startKey: string): Observable<IApiGridResponse<ISign[]>> {
    return this.http
      .get<IApiGridResponse<ISign[]>>(`${this.apiUrl}/signs?start_key=${startKey}`, this.withCredentials)
      .pipe(pluck('data'));
  }

  public getSignsFilter(filter: string): Observable<IApiGridResponse<ISign[]>> {
    return this.http
      .get<IApiGridResponse<ISign[]>>(`${this.apiUrl}/signs?filter=${filter}`, this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * Delete sign
   * @param signId: string
   */
  public deleteSign(signId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/signs/${signId}`, this.withCredentials);
  }

  /**
   * Get sign form info
   * @param signId: string
   */
  getFormInfo(signId: string): Observable<ISign> {
    return this.http.get<ISign>(`${this.apiUrl}/signs/${signId}`, this.withCredentials).pipe(pluck('data'));
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
    return !(
      this.router.url.includes('e-signs/e-signs-builder') || this.router.url.includes('e-signs/doc-e-signs-builder')
    );
  }
}
