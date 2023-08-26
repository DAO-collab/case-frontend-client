import { Component, OnDestroy, OnInit } from '@angular/core';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { Observable, Subject, throwError } from 'rxjs';

import { InvoicesService } from '../../../services/invoices.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { UsersService } from '../../users/services/users.service';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class InvoicesComponent implements OnInit, OnDestroy {
  invoices$?: Observable<any>;
  users$?: Observable<any>;
  isLoading = true;
  invoicePaidStatus = 'paid';
  selectedRefundInvoice: any;

  private destroy$ = new Subject<void>();

  constructor(
    private invoicesService: InvoicesService,
    private notificationsService: PopInNotificationConnectorService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.invoices$ = this.getInvoices();
    this.users$ = this.usersService.getUsers().pipe(takeUntil(this.destroy$));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getInvoices(): Observable<any> {
    return this.invoicesService.getInvoices().pipe(
      takeUntil(this.destroy$),
      tap(() => (this.isLoading = false))
    );
  }

  openRefundModal(invoice: any): void {
    this.selectedRefundInvoice = { ...invoice };
  }

  closeModal(): void {
    this.selectedRefundInvoice = null;
  }

  refund(reason: any): void {
    const notification: Notification = this.notificationsService.addNotification({ title: 'Refunding' });
    const data = {
      case_id: this.selectedRefundInvoice.case_id,
      invoice_id: this.selectedRefundInvoice.invoice_id,
      reason
    };

    this.closeModal();

    this.invoicesService
      .postRefundInvoices(data)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.notificationsService.failed(notification, err.error.message);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.invoices$ = this.getInvoices();
        this.notificationsService.ok(notification, 'Refunded');
      });
  }

  getUserName(users: any, userId: string): string | void {
    const person = users.find((user: any) => user.user_id === userId);

    if (person) {
      return `${person.given_name} ${person.family_name}`;
    }
  }

  copyText(invoice: any): void {
    navigator.clipboard.writeText(invoice.case_id).then();
    const notification: Notification = this.notificationsService.addNotification({
      title: `Case ID Copied`
    });
    this.notificationsService.ok(notification, 'ok');
  }
  copyInvoiceId(invoice: any): void {
    navigator.clipboard.writeText(invoice.invoice_id).then();
    const notification: Notification = this.notificationsService.addNotification({
      title: `Invoice ID Copied`
    });
    this.notificationsService.ok(notification, 'ok');
  }
}
