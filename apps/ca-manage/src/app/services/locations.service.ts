import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { API_URL } from '../shared/constants.utils';
import { HttpClient } from '@angular/common/http';
import { pluck } from 'rxjs/operators';
import { ILocation } from '../pages/modules/office/models/location.model';
import { IApiGridResponse } from '../interfaces/api-response.model';

@Injectable()
export class LocationsService {
  private withCredentials = { withCredentials: true };
  private addLocationSubject = new Subject<any>();

  public activeLocationPopUp: Observable<any> = this.addLocationSubject.asObservable();

  /**
   * Show Add Location Modal
   */
  public activateAddLocationModal() {
    this.addLocationSubject.next(true);
  }

  constructor(private http: HttpClient) {}

  /**
   * Add new location
   * @param locationData: ILocation
   */
  public addLocation(locationData: ILocation): Observable<any> {
    if (!locationData.permissions || !locationData.permissions.length) {
      delete locationData.permissions;
    }
    return this.http.post(API_URL('/locations'), locationData, this.withCredentials).pipe(pluck('data'));
  }

  /**
   * Delete the location
   * @param locationId: string
   */
  public deleteLocation(locationId: string): Observable<any> {
    return this.http.delete(API_URL(`/locations/${locationId}`), this.withCredentials);
  }

  /**
   * Get all locations
   */
  public getLocations(): Observable<IApiGridResponse<ILocation[]>> {
    return this.http
      .get<IApiGridResponse<ILocation[]>>(API_URL('/locations'), this.withCredentials)
      .pipe(pluck('data'));
  }

  public getMoreLocations(startKey: string): Observable<IApiGridResponse<ILocation[]>> {
    return this.http
      .get<IApiGridResponse<ILocation[]>>(API_URL(`/locations?start_key=${startKey}`), this.withCredentials)
      .pipe(pluck('data'));
  }
}
