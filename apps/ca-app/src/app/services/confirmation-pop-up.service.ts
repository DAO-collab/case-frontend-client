import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationPopUpService {
  private popUpActivatedSubject: Subject<any> = new Subject();
  popUpActivation = this.popUpActivatedSubject.asObservable();
  onYes: any;

  constructor() {}

  popUpActivated(obj: any) {
    this.popUpActivatedSubject.next(obj);
  }

  removeRecord() {
    if (this.onYes) {
      this.onYes.emit();
    }
  }
}
