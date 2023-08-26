import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IApiGridResponse } from '../../../interfaces/api-response.model';
import { API_URL } from '../../../shared/constants.utils';
import { IKey } from '../models/key.model';
import { Observable, Subject } from 'rxjs';
import { pluck } from 'rxjs/operators';

@Injectable()
export class KeysService {
  private addKeySubject = new Subject<any>();

  activeKeyPopUp: Observable<any> = this.addKeySubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Show Add Key Modal
   */
  activateAddKeyModal() {
    this.addKeySubject.next(true);
  }

  /**
   * Get keys list
   */
  fetchKeys(): Observable<IApiGridResponse<IKey[]>> {
    return this.http.get<IApiGridResponse<IKey[]>>(API_URL(`/keys`)).pipe(pluck('data'));
  }

  fetchMoreKeys(startKey: string): Observable<IApiGridResponse<IKey[]>> {
    return this.http.get<IApiGridResponse<IKey[]>>(API_URL(`/keys?start_key=${startKey}`)).pipe(pluck('data'));
  }

  /**
   * Get key by id
   */
  getKey(keyId: string): Observable<IApiGridResponse<IKey[]>> {
    return this.http.get<IApiGridResponse<IKey[]>>(API_URL(`/keys/${keyId}`)).pipe(pluck('data'));
  }

  /**
   * Save key
   */
  saveKey(keyData: IKey): Observable<{ token: string; selfLink: string }> {
    return this.http.post(API_URL(`/keys`), keyData).pipe(pluck('data'));
  }

  /**
   * Update key
   */
  updateKey(keyId: string, keyData: IKey): Observable<any> {
    return this.http.put(API_URL(`/keys/${keyId}`), keyData);
  }

  /**
   * Remove key
   */
  removeKey(keyId: string): Observable<any> {
    return this.http.delete(API_URL(`/keys/${keyId}`));
  }
}
