import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { AppsService } from '../../../services/apps.service';
import { OptionsService } from './../../../services/options.service';
import { IApp } from '../../../interfaces/app.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IUserFields } from '../../../pages/users/models/user.model';

/**
 * Accept app invitation modal.
 */
@Component({
  selector: 'app-accept-invitation-modal',
  templateUrl: './accept-invitation-modal.component.html',
  styleUrls: ['./accept-invitation-modal.component.css']
})
export class AcceptInvitationModalComponent implements OnInit, OnDestroy {
  @Input() app?: IApp;

  userFields?: string[];
  acceptInvitationStatus = 1;
  revokeInvitationStatus = 0;

  private destroy$ = new Subject<void>();

  constructor(private appsService: AppsService, private optionsService: OptionsService) {}

  /**
   * Initializes accept invitation fields.
   */
  ngOnInit(): void {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.appsService.showModal) {
        this.closeModal();
      }
    });

    this.optionsService
      .userFields()
      .pipe(takeUntil(this.destroy$))
      .subscribe((userFields: IUserFields) => {
        this.userFields = this.app?.require_userfields.map((userFieldKey: any) => userFields[userFieldKey as keyof IUserFields]);
      });
  }

  /**
   *  Shows accept invitation pop-up.
   */
  public acceptAppInvitation(): void {
    this.appsService
      .acceptApp(this.app?.host_id!, this.acceptInvitationStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appsService.acceptInvitationSubject.next(true);
        this.appsService.showModal = false;
      });
  }

  /**
   * Revoke app invitation.
   */
  public revokeAppInvitation(): void {
    this.appsService
      .acceptApp(this.app?.host_id!, this.revokeInvitationStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appsService.acceptInvitationSubject.next(true);
        this.appsService.showModal = false;
      });
  }

  /**
   *  Close modal.
   */
  public closeModal(): void {
    this.appsService.showModal = false;
  }

  /**
   * Unsubscribe from observables.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
