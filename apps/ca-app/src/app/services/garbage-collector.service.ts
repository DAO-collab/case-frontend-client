import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs/index';

@Injectable()
export class GarbageCollectorService {
  private destroySubject: Subject<any> = new Subject<any>();
  public destroyCommand: Observable<any> = this.destroySubject.asObservable();

  constructor() {}

  public destroyActiveComponent() {
    this.destroySubject.next();
  }
}
