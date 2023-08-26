import { Injectable, ApplicationRef } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationPopUpService {
  // PopUp activation observable
  private popUpActivatedSubject: Subject<any> = new Subject();
  popUpActivation = this.popUpActivatedSubject.asObservable();

  /**
   * Observable is using to comamnd to close popup from source component to component where popup is located
   * this is neccessary when we use loader in popup till confirmation process is donw
   */
  private popUpDisactivateSubject: Subject<any> = new Subject();
  popUpDisactivation = this.popUpDisactivateSubject.asObservable();

  onYes: any;

  constructor(private applicationRef: ApplicationRef) {}

  popUpActivated(obj: any) {
    this.popUpActivatedSubject.next(obj);
  }

  removeRecord() {
    if (this.onYes) {
      this.onYes.emit();
    }
  }

  disactivatePopUp() {
    this.popUpDisactivateSubject.next();
  }
}
