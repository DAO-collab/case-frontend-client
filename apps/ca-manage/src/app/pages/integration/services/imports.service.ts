import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, Subject } from 'rxjs';
import { pluck } from 'rxjs/operators';

import { IApiGridResponse } from '../../../interfaces/api-response.model';
import { API_URL } from '../../../shared/constants.utils';
import { IImport, IImportItem, ImportsSearchAttribute } from '../models/import.model';

@Injectable()
export class ImportsService {
  importTitleSubject = new Subject<string>();

  private addImportsSubject = new Subject<any>();

  activeImportsPopUp: Observable<any> = this.addImportsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Show Add Imports Modal
   */
  updateImportTitle(title: string) {
    this.importTitleSubject.next(title);
  }

  /**
   * Show Add Imports Modal
   */
  activateAddImportsModal() {
    this.addImportsSubject.next(true);
  }

  /**
   * Get imports list
   */
  fetchImports(): Observable<IApiGridResponse<IImport[]>> {
    return this.http.get<IApiGridResponse<IImport[]>>(API_URL(`/imports`)).pipe(pluck('data'));
  }

  fetchMoreImports(startKey: string): Observable<IApiGridResponse<IImport[]>> {
    return this.http.get<IApiGridResponse<IImport[]>>(API_URL(`/imports?start_key=${startKey}`)).pipe(pluck('data'));
  }

  /**
   * Get import by id
   */
  getImport(importId: string): Observable<IApiGridResponse<IImportItem[]>> {
    return this.http.get<IApiGridResponse<IImportItem[]>>(API_URL(`/imports/${importId}`)).pipe(pluck('data'));
  }

  /**
   * Save import
   */
  saveImport(importData: IImport): Observable<{ host_id: string; import_id: string; selfLink: string }> {
    return this.http.post(API_URL(`/imports`), importData).pipe(pluck('data'));
  }

  /**
   * Retry import
   */
  retryImport(importId: string, uniqueId: string): Observable<any> {
    const payload = { retry: true };
    return this.http.put(API_URL(`/imports/${importId}/${uniqueId}`), payload);
  }

  /**
   * Attach file media key to the import
   */
  attachMediaToImport(mediaKey: string, importId: string): Observable<any> {
    return this.http.put(API_URL(`/imports/${importId}`), { media_key: mediaKey });
  }

  /**
   * Process imports search
   */
  public searchImports(attribute: ImportsSearchAttribute, value: string): Observable<IApiGridResponse<IImport[]>> {
    const valueQuery = value.trim() ? '&value=' + value.trim() : '';

    return this.http
      .get<IApiGridResponse<IImport[]>>(API_URL(`/imports/search?attribute=${attribute}${valueQuery}`))
      .pipe(pluck('data'));
  }
}
