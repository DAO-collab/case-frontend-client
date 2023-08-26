import { Inject, Injectable, OnDestroy } from '@angular/core';
import { ACCOUNT_CLIENT_URL } from '../shared/constants.utils';
import { HostService } from './host.service';
import { environment } from '../../environments/environment';
import { Subject, interval, of } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AutologoutService implements OnDestroy {
  private readonly accountClientUrl = ACCOUNT_CLIENT_URL;
  private destroy$: Subject<void> = new Subject<void>();

  constructor(private hostService: HostService, @Inject(DOCUMENT) private document: Document) {
    interval(5000)
      .pipe(
        switchMap(() => this.hostService.getHostInfo()),
        catchError(err => {
          this.document.defaultView!.location.href = environment.IS_LOCAL
            ? `http://localhost:4201`
            : `${this.accountClientUrl}`;
          return of(err);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
