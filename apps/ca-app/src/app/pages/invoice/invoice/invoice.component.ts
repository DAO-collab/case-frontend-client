import { UtilsLibsService } from './../../../../../../../libs/ui/src/lib/services/utils-libs.service';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialToggleComponent } from 'ngx-slide-toggle';
import { delay, finalize, map, takeUntil } from 'rxjs/operators';
import { Observable, Subject, Subscription } from 'rxjs';
import { CaseStatus } from '@app/types';

import { InvoicesService } from '../../../services/invoices.service';
import { UserService } from '../../../services/user.service';
import { CasesService } from '../../../services/cases.service';
import { UtilsService } from '../../../services/utils.service';
import { Person } from '../../../shared/document-forms-builder';
import { InvoiceCreateComponent } from '../invoice-create/invoice-create.component';
import { StylesService } from '../../../services/styles.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { InvoiceModel } from '../models/invoice-models';
import { TInvoiceCurrentTabState } from '../../../services/types/tab-state.type';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css']
})
export class InvoiceComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(InvoiceCreateComponent) invoiceCreateComponent?: InvoiceCreateComponent;

  public permissions: { [key: string]: string } | null = null;
  public showModal: boolean = false;
  public caseId: string = '';
  public allInvoices?: any;
  public showTypeInvoices: TInvoiceCurrentTabState = 'unpaid';
  public loading = false;
  public userData?: any;
  public people: Person[] = [];
  public teamData: any = {};
  public publishingInvoice: boolean = false;
  public unsubscribe$: Subject<void> = new Subject();
  public currentCaseStatus$: Observable<CaseStatus | undefined>;
  public whoami$?: Observable<any>;
  public newElementsSectionIsLoading = false;

  private firstUserAttendComponentSubscription?: any;
  private subscribers: Subscription[] = [];
  private routeCaseId: string = '';
  private routeInvoiceId: string = '';
  private invoiceAction?: string | null;
  private destroyComponent = new Subject();
  private limitIncrease: number = 50;
  private limit: number = this.limitIncrease;

  constructor(
    private invoicesService: InvoicesService,
    private userService: UserService,
    private casesService: CasesService,
    private activateRoute: ActivatedRoute,
    public utilsService: UtilsService,
    private cd: ChangeDetectorRef,
    private router: Router,
    public stylesService: StylesService,
    private notificationsService: PopInNotificationConnectorService,
    private errorD: LocalTranslationService,
    private utilsLibsService: UtilsLibsService
  ) {
    this.currentCaseStatus$ = this.casesService.activeCaseObs$.pipe(map((data) => data?.status));
  }

  ngOnInit() {
    this.invoicesService.activateCreateInvoiceModal.subscribe(res => {
      this.showModal = res;
    });

    this.subscribers.push(
      this.casesService.getCaseId.subscribe(res => {
        this.caseId = res['case_id'];
        this.whoami$ = this.userService.getPossibleVariable(this.caseId);

        this.activateRoute.queryParams.subscribe(params => {
          this.routeCaseId = params['case'] || '';
          this.routeInvoiceId = params['invoices'] || '';
          const tabParam = params['tab'] || '';
          if (tabParam === 'published') {
            this.loadInvoices('all');
          }
          if (tabParam === 'paid' || tabParam === 'unpaid') {
            this.loadInvoices(tabParam);
          }
        });
        this.firstUserAttendComponentSubscription = this.invoicesService
          .getInvoices(this.caseId, this.showTypeInvoices, this.limit)
          .subscribe(res => {
            this.allInvoices = res;
          });
      })
    );

    this.errorD.loadErrors();

    if (this.userService.rolesPermissions[this.caseId]) {
      this.permissions = {};
      this.userService.rolesPermissions[this.caseId].data.permissions.invoices.map((v: any) => {
        this.permissions![v] = v;
      });
    }

    this.userService.getTeamData.pipe(takeUntil(this.destroyComponent)).subscribe(data => {
      this.people = data!.items.map((usr) => {
        this.teamData[usr.user_id] = usr;
        return {
          id: usr.user_id,
          text: `${usr.given_name} ${usr.family_name}`,
          role_id: usr?.role_id ?? ''
        };
      });
    });

    this.userService.getCasePermissionsData.pipe(takeUntil(this.destroyComponent)).subscribe(data => {
      this.permissions = {};

      data.role.permissions.invoices.map((v) => {
        this.permissions![v] = v;
      });
    });

    this.userData = this.userService.userData;

    if (!this.userData) {
      this.userService.getUserData.subscribe(resp => {
        this.userData = resp;
      });
    }
  }

  ngAfterViewInit() {
    this.invoicesService.invoiceDirectLinkSubject
      .asObservable()
      .pipe(delay(1000), takeUntil(this.destroyComponent))
      .subscribe(res => {
        if (res?.id) {
          this.invoiceAction = res?.action || null;

          if (res?.action === 'submit') {
            this.loadInvoices('unpaid', res?.id);
          }

          this.invoicesService.invoiceDirectLinkSubject.next(null);
        }
      });
  }

  ngOnDestroy() {
    this.destroyComponent.next(true);
    this.destroyComponent.complete();
  }

  public showInvoicesByType(id?: any, showLoader: boolean = true) {
    this.loading = showLoader;
    this.newElementsSectionIsLoading = !showLoader;
    
    if (this.firstUserAttendComponentSubscription) this.firstUserAttendComponentSubscription.unsubscribe$;
    this.invoicesService.getInvoices(this.caseId, this.showTypeInvoices, this.limit).subscribe(res => {
      showLoader 
        ? this.allInvoices = res
        : this.utilsLibsService.recreateLoadMoreObject(this.allInvoices, res, 'items', this.limit);
     
      this.loading = false;
      this.newElementsSectionIsLoading = false;
      
      // open forms direct link for view or submit
      if (id && this.invoiceAction === 'submit') {
        const invoice = this.allInvoices.items.filter((invoice: any) => invoice.invoice_id === id)[0];

        invoice
          ? this.router.navigate(['invoices/invoice-builder', id])
          : this.router.navigate(['invoices/invoice-submit', id]);
      }
    });
  }

  public loadInvoices(flag?: any, id?: any) {
    if (flag) this.showTypeInvoices = flag;

    this.limit = this.limitIncrease;

    this.showInvoicesByType(id);
  }

  public loadMoreInvoices(): void {
    this.limit += this.limitIncrease;

    this.showInvoicesByType(null, false);
  }

  public closeModal(): void {
    this.invoiceCreateComponent?.refreshModal();
    this.showModal = false;
    this.invoiceCreateComponent!.formTouched = false;
  }

  public openInvoiceBuilder(invoice: any) {
    this.router.navigate([`/invoices/invoice-builder/${invoice.invoice_id}`]);
  }

  public deleteInvoice(ind: number, invoice: any) {
    const removedInvoice = this.allInvoices.items.splice(ind, 1);

    this.invoicesService
      .deleteInvoice(this.caseId, invoice.invoice_id)
      .pipe(takeUntil(this.destroyComponent))
      .subscribe(
        () => {},
        () => this.allInvoices.items.unshift(removedInvoice)
      );
  }

  public openModal(invoice: any, preview = false): void {
    this.invoiceCreateComponent?.refreshModal();
    this.invoiceCreateComponent!.isReadOnly = preview;
    this.invoiceCreateComponent!.caseId = this.caseId;
    this.invoiceCreateComponent!.invoiceModel.invoice_id = invoice.invoice_id || '';
    this.invoiceCreateComponent?.loadOpenedInvoiceInformation();
    this.invoiceCreateComponent!.isOpened = this.showModal = true;
  }

  togglePublished(element: any, invoice: any) {
    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving invoice`
    });

    if (!invoice.participants_ids) {
      this.notificationsService.failed(notification, 'For publishes first select the person to answer');
      return;
    }

    // invoice.published ? invoice.published = 1 : invoice.published = 0
    invoice.published === 0 ? (invoice.published = 1) : (invoice.published = 0);
    this.publishingInvoice = true;
    this.invoicesService
      .updateInvoice(this.caseId, invoice, invoice.invoice_id, 'publish')
      .pipe(
        takeUntil(this.destroyComponent),
        finalize(() => (this.publishingInvoice = false))
      )
      .subscribe(
        () => this.notificationsService.ok(notification, 'Invoice Updated'),
        err => {
          invoice.published ? (invoice.published = 1) : (invoice.published = 0);

          if (err.error.error.message === 'PublishItemFieldsMissingException') {
            this.notificationsService.failed(
              notification,
              'You cannot publish an invoice if there is no transactions added to it'
            );
          } else {
            this.errorD
              .showError(err.error.error.message)
              .pipe(takeUntil(this.unsubscribe$))
              .subscribe(errorMessage => this.notificationsService.failed(notification, errorMessage));
          }

          this.publishingInvoice = false;

          element.checked = !element.checked;
        }
      );
  }

  public openSubmitInvoice(invoice: any) {
    this.router.navigate([`/invoices/invoice-submit/${invoice.invoice_id}`]);
    this.invoicesService.currentTab$.next(this.showTypeInvoices);
  }

  public dontPublish(element: MaterialToggleComponent, invoice: InvoiceModel): void {
    invoice.published = 0;
    this.publishingInvoice = false;
    element.checked = false;
    element.inputElement.nativeElement.checked = false;
  }
}
