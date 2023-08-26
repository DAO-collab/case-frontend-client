import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Observable, Subject, combineLatest } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, skip, switchMap, takeUntil, tap } from 'rxjs/operators';

import { InvoicesService } from '../../../services/invoices.service';
import { CasesService } from '../../../services/cases.service';
import { InvoiceModel } from '../models/invoice-models';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { LocalTranslationService } from '../../../services/local-translation.service';

@Component({
  selector: 'app-invoice-builder',
  templateUrl: './invoice-builder.component.html',
  styleUrls: ['./invoice-builder.component.css']
})
export class InvoiceBuilderComponent implements OnInit, OnDestroy {
  @ViewChildren('resizeTextarea') textAreas?: QueryList<ElementRef>;

  public invoiceModel: InvoiceModel = new InvoiceModel();
  public invoiceId?: string;
  public caseId?: string;
  public unsubscribe$: Subject<void> = new Subject();
  public builderForm = this.fb.group({
    po_number: new UntypedFormControl(''),
    reference_id: new UntypedFormControl(''),
    terms: new UntypedFormControl(''),
    notes: new UntypedFormControl('')
  });
  public transactionsInfo = this.fb.group({
    discount: new UntypedFormControl('', Validators.required),
    tax: new UntypedFormControl('', Validators.required),
    transactions: this.fb.array([])
  });
  public priceItems: { id: string; text: string }[] = [
    { id: 'charge', text: 'Charge' },
    { id: 'credit', text: 'Credit' }
  ];
  public defaultTransaction = {
    description: new UntypedFormControl('Your description', Validators.required),
    quantity: new UntypedFormControl(1, Validators.required),
    transaction_type: new UntypedFormControl('charge', Validators.required),
    value: new UntypedFormControl(1, Validators.required)
  };
  public isEditMode = true;
  public loading = true;

  private readonly delayTime: number = 1000;

  public formChanges$ = combineLatest([
    this.transactionsInfo.valueChanges.pipe(
      debounceTime(this.delayTime),
      distinctUntilChanged((prev, next) => {
        return prev.discount === next.discount && prev.tax === next.tax;
      })
    ),
    this.builderForm.valueChanges.pipe(
      debounceTime(this.delayTime),
      distinctUntilChanged((prev, next) => {
        return (
          prev.po_number === next.po_number &&
          prev.reference_id === next.reference_id &&
          prev.terms === next.terms &&
          prev.notes === next.notes
        );
      })
    ),
    this.transactions.valueChanges.pipe(
      debounceTime(this.delayTime),
      distinctUntilChanged((prev, next) => {
        return (
          prev.length === next.length &&
          prev.every((element: any, index: number) => {
            return (
              element.value === next[index].value &&
              element.description === next[index].description &&
              element.quantity === next[index].quantity &&
              element.transaction_type === next[index].transaction_type
            );
          })
        );
      })
    )
  ]).pipe(
    skip(1),
    switchMap(() => this.submitInvoiceInfoOnChanges())
  );

  private subTotal: number = 0;
  private destroyComponent: Subject<boolean> = new Subject();

  get transactions(): UntypedFormArray {
    return this.transactionsInfo.get('transactions') as UntypedFormArray;
  }

  get transactionsControls(): UntypedFormGroup[] {
    return this.transactions.controls as UntypedFormGroup[];
  }

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private casesService: CasesService,
    private invoicesService: InvoicesService,
    private notificationsService: PopInNotificationConnectorService,
    private errorD: LocalTranslationService
  ) {}

  ngOnInit() {
    this.casesService.getCaseId.pipe(takeUntil(this.destroyComponent)).subscribe(res => {
      const invoiceBuilderWord = 'invoice-builder/';
      const invoiceIndex = this.router.url.indexOf(invoiceBuilderWord);

      this.invoiceId = this.router.url.slice(invoiceIndex + invoiceBuilderWord.length);
      this.caseId = res['case_id'];

      this.invoicesService
        .getInvoice(this.caseId as any, this.invoiceId)
        .pipe(takeUntil(this.destroyComponent))
        .subscribe(res => {
          this.loading = false;
          this.invoiceModel = res;
          this.builderForm.patchValue({
            po_number: this.invoiceModel.po_number || '',
            reference_id: this.invoiceModel.reference_id || '',
            terms: this.invoiceModel.terms || '',
            notes: this.invoiceModel.notes || ''
          });
          this.transactionsInfo.patchValue({
            tax: this.invoiceModel.transactions?.tax || 0,
            discount: this.invoiceModel.transactions?.discount || 0,
            transactions: this.invoiceModel.transactions?.transactions || []
          });
          this.invoiceModel.transactions?.transactions?.forEach(item => this.addTransactionItem(item));

          if (!this.invoiceModel.transactions?.transactions?.length) this.addTransactionItem();
        });
    });
  }

  ngOnDestroy() {
    this.destroyComponent.next(true);
    this.destroyComponent.complete();
  }

  public addTransactionItem(transaction?: any): void {
    transaction
      ? this.transactions.push(this.buildTransactionForm(transaction))
      : this.transactions.push(this.buildTransactionForm());
  }

  public removeTransaction(index: number) {
    if (this.transactions.length > 1) this.transactions.removeAt(index);
  }

  private buildTransactionForm(transaction?: any) {
    return this.fb.group(
      transaction
        ? {
            ...transaction,
            value: Number((transaction.value / 100).toFixed(2))
          }
        : this.defaultTransaction
    );
  }

  togglePublished(invoice: any, flag: any) {
    const published = flag ? 1 : 0;
    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving invoice`
    });
    this.buildInvoiceForm();
    this.invoicesService
      .updateInvoice(this.caseId as any, { ...this.invoiceModel, published }, invoice.invoice_id, 'publish')
      .pipe()
      .subscribe(
        () => {
          this.notificationsService.ok(notification, 'Invoice Updated');
          this.router.navigate(['invoices']);
        },
        err => {
          if (err.error.error.message === 'SchemaMissingException') {
            notification.width = '450px';

            this.notificationsService.failed(
              notification,
              'You cannot publish a invoice if there is no field added to it'
            );
          } else if (err.error.error.message === 'SchemaModifyException') {
            this.notificationsService.failed(notification, `An answered invoice can't be modified`);
          } else {
            this.errorD
              .showError(err.error.error.message)
              .pipe(takeUntil(this.unsubscribe$))
              .subscribe(errorMessage => this.notificationsService.failed(notification, errorMessage));
          }
        }
      );
  }

  public goToInvoice(): void {
    //this.router.navigate(['invoice']);
    this.router.navigate(['invoices'], { queryParams: { tab: 'published' } });
  }

  public resizeEvent(event: any) {
    for (let l = 0; l < this.textAreas!.toArray()!.length; l++) {
      this.textAreas!.toArray()[l].nativeElement.style.height = event.height + 'px';
    }
  }

  public calculateSubTotal(): number {
    this.subTotal = 0;
    this.transactionsInfo.value.transactions.forEach((item: any) => {
      item.transaction_type === 'charge'
        ? (this.subTotal = this.subTotal + item.quantity * item.value)
        : (this.subTotal = this.subTotal - item.quantity * item.value);
    });
    this.subTotal = this.roundToTwo(this.subTotal);

    return this.subTotal;
  }

  public calculateTotal(): number {
    const total = this.subTotal - (this.subTotal * this.transactionsInfo?.value?.discount) / 100;

    return this.roundToTwo(total + (total * this.transactionsInfo?.value?.tax) / 100);
  }

  private roundToTwo(num: number) {
    return +(Math.round((num + 'e+2') as any) + 'e-2');
  }

  public toggleEditMode() {
    if (this.isEditMode) {
      this.buildInvoiceForm();
    }

    this.isEditMode = !this.isEditMode;
  }

  private buildInvoiceForm() {
    this.invoiceModel.po_number = this.builderForm.value.po_number;
    this.invoiceModel.reference_id = this.builderForm.value.reference_id;
    this.invoiceModel.terms = this.builderForm.value.terms;
    this.invoiceModel.notes = this.builderForm.value.notes;

    if (!this.invoiceModel.transactions) {
      this.invoiceModel.transactions = {
        discount: null,
        tax: null,
        transactions: [
          {
            description: '',
            quantity: null,
            transaction_type: '',
            value: null
          }
        ]
      };
    }

    this.invoiceModel.transactions.discount =
      this.transactionsInfo.value.discount === null ? 0 : this.transactionsInfo.value.discount;
    this.invoiceModel.transactions.tax = this.transactionsInfo.value.tax === null ? 0 : this.transactionsInfo.value.tax;
    this.invoiceModel.transactions.transactions = this.transactionsInfo.value.transactions.map((transaction: any) => ({
      ...transaction,
      value: Math.round(transaction.value * 100)
    }));
  }

  public submitInvoiceInfo() {
    this.buildInvoiceForm();

    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving invoice`
    });

    this.invoicesService
      .updateInvoice(this.caseId as any, this.invoiceModel, this.invoiceModel?.invoice_id!, 'transactions')
      .subscribe(
        () => {
          this.notificationsService.ok(notification, 'Invoice Updated');

          this.goToInvoice();
        },
        err => {
          this.notificationsService.failed(notification, err.message);
        }
      );
  }

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  private submitInvoiceInfoOnChanges(): Observable<unknown> {
    this.buildInvoiceForm();

    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving invoice`
    });
    return this.invoicesService
      .updateInvoice(this.caseId as any, this.invoiceModel, this.invoiceModel?.invoice_id!, 'transactions')
      .pipe(
        catchError(err => {
          this.notificationsService.failed(notification, err.message);
          throw err;
        }),
        tap(() => this.notificationsService.ok(notification, 'Invoice Updated'))
      );
  }
}
