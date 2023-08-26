import { Injectable, ElementRef, Renderer2, RendererFactory2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { Router } from '@angular/router';

import { API_URL } from '../shared/constants.utils';

export enum CreateFormType {
  FormBuilder = 'builder',
  FileUpload = 'document'
}

@Injectable({
  providedIn: 'root'
})
export class IntakeFormsService {
  public isFieldsDisabled = false;
  public activateFormModal: Subject<CreateFormType> = new Subject();
  public activateUserIntakeModal: Subject<boolean> = new Subject();
  public updateUserIntakesData: Subject<boolean> = new Subject();
  public editPopupData?: any;

  private withCredentials = { withCredentials: true };
  private renderer: Renderer2;

  constructor(private http: HttpClient, private router: Router, private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  public getIntakesForm(): Observable<any> {
    return this.http.get(API_URL(`/intakes`), this.withCredentials).pipe(pluck('data'));
  }

  public getIntakeForm(intakeId: string): Observable<any> {
    return this.http.get(API_URL(`/intakes/${intakeId}`), this.withCredentials).pipe(pluck('data'));
  }

  public postIntakesForm(request: any): Observable<any> {
    return this.http.post(API_URL(`/intakes`), request, this.withCredentials).pipe(pluck('data'));
  }

  public putIntakeForm(request: any, intakeId: string): Observable<any> {
    return this.http.put(API_URL(`/intakes/${intakeId}`), request, this.withCredentials);
  }

  public deleteIntakesForm(intakeId: string): Observable<any> {
    return this.http.delete(API_URL(`/intakes/${intakeId}`), this.withCredentials);
  }

  public putIntakeSettings(data: any): Observable<any> {
    return this.http.put(API_URL(`/settings/intake/`), data, this.withCredentials);
  }

  public scaleBuilder(pinchZoomWrapper: ElementRef, element: any): number {
    this.renderer.setStyle(pinchZoomWrapper.nativeElement, '-webkit-transform', `scale(1)`);
    this.renderer.setStyle(pinchZoomWrapper.nativeElement.querySelector('pinch-zoom'), 'width', `100%`);

    const defaultHeight = element.naturalHeight,
      defaultWidth = element.naturalWidth,
      scaleWidth = element.clientWidth / defaultWidth,
      scaleHeight = element.clientHeight / defaultHeight,
      scale = Math.min(scaleWidth, scaleHeight),
      width = element.clientWidth / scale,
      mr = -element.clientWidth / scale + element.clientWidth;

    this.renderer.setStyle(pinchZoomWrapper.nativeElement, '-webkit-transform', `scale(${scale})`);
    this.renderer.setStyle(pinchZoomWrapper.nativeElement, '-webkit-transform-origin', `0 0`);
    this.renderer.setStyle(pinchZoomWrapper.nativeElement.querySelector('pinch-zoom'), 'width', `${width}px`);
    this.renderer.setStyle(pinchZoomWrapper.nativeElement.querySelector('pinch-zoom'), 'margin-right', `${mr}px`);

    return scale;
  }

  public checkRoutes() {
    return !(this.router.url.includes('library/form-builder') || this.router.url.includes('library/doc-form-builder'));
  }
}
