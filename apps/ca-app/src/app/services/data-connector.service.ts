import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataConnectorService {
  private interceptorErrorSubject = new Subject();
  public interceptorError = this.interceptorErrorSubject.asObservable();

  constructor() {}

  public errorPopupCall() {
    this.interceptorErrorSubject.next();
  }
}
