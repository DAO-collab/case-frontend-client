import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Data connector service.
 */
@Injectable({
  providedIn: 'root'
})
export class DataConnectorService {
  private interceptorErrorSubject = new Subject();
  public interceptorError = this.interceptorErrorSubject.asObservable();

  /**
   * Pops up on error.
   */
  public errorPopupCall() {
    this.interceptorErrorSubject.next();
  }
}
