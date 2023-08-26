import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs/index';
import { API_URL } from '../utils/constants.utils';
import { pluck } from 'rxjs/operators';
import { AppLocation, IDefaultResponse } from '@app/interfaces';

@Injectable()
export class LocationsService {
  private withCredentials = { withCredentials: true };
  private addLocationSubject = new Subject<any>();
  public activeLocationPopUp: Observable<any> = this.addLocationSubject.asObservable();

  public activateAddLocationModal() {
    this.addLocationSubject.next(true);
  }

  constructor(public http: HttpClient) {}

  public sendLocation(name: string, locationStr: string) {
    return this.http
      .put(`${API_URL}/locations/${name}`, { location: locationStr }, this.withCredentials)
      .pipe(pluck('data'));
  }

  public deleteLocation(name: string) {
    return this.http.delete(`${API_URL}/case/locations/${name}`, this.withCredentials);
  }

  public getLocations(caseId: string): Observable<IDefaultResponse<AppLocation[]>> {
    return this.http.get(`${API_URL}/${caseId}/templates/locations`, this.withCredentials).pipe(pluck('data'));
  }
}
