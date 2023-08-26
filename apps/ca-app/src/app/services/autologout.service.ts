import { Inject, Injectable, OnDestroy } from '@angular/core';
import { ACCOUNT_CLIENT_URL } from '../utils/constants.utils';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { Subject, interval, of } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AutologoutService implements OnDestroy {
  private readonly accountClientUrl = ACCOUNT_CLIENT_URL;
  private destroy$: Subject<void> = new Subject<void>();

  constructor(private userService: UserService, @Inject(DOCUMENT) private document: Document) {
    interval(5000)
      .pipe(
        switchMap(() => this.userService.getAuthStatus()),
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
