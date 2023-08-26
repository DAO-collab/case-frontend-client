import { EventEmitter, Injectable, Output } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublishPopUpService {
  private popUpActivatedSubject: Subject<any> = new Subject();
  popUpActivation = this.popUpActivatedSubject.asObservable();
  onPublish: any;
  onLater: any;
  @Output() public onClose: EventEmitter<void> = new EventEmitter<void>();

  constructor() {}

  popUpActivated(obj: any) {
    this.popUpActivatedSubject.next(obj);
  }

  publish() {
    if (this.onPublish) {
      this.onPublish.emit();
    }
  }

  later() {
    if (this.onLater) {
      this.onLater.emit();
    }
  }

  public close(): void {
    if (this.onClose) {
      this.onClose.emit();
    }
  }
}
