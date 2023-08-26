import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { combineLatest, Observable, Subject, throwError } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';

import { Stripe, StripeElements } from '@stripe/stripe-js';

import { CasesService } from '../../../services/cases.service';
import { InvoicesService } from '../../../services/invoices.service';
import { InvoiceModel } from '../models/invoice-models';

import { HostService } from '../../../services/host.service';
import { UserService } from '../../../services/user.service';
import jsPDF from 'jspdf';
// import * as htmlToPdfmake from 'html-to-pdfmake';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { APP_FAVICON } from '../../../utils/constants.utils';
import { PaymentService } from '../../../services/payment.service';
import { environment } from '../../../../environments/environment';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';

(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-invoice-submit',
  templateUrl: './invoice-submit.component.html',
  styleUrls: ['./invoice-submit.component.css']
})
export class InvoiceSubmitComponent implements OnInit {
  public invoiceModel: InvoiceModel = new InvoiceModel();
  public invoiceId?: string;
  public caseId?: string;
  public loading = true;
  public whoami$?: Observable<any>;
  public stripe$?: Observable<any>;
  public hidePayments: boolean = false;
  public selectedPaymentId?: string;
  public paymentError?: string;

  private destroyComponent: Subject<boolean> = new Subject();
  private stripe: any;
  private stripeElements?: StripeElements;
  private systemColors: any;

  constructor(
    private router: Router,
    private casesService: CasesService,
    private invoicesService: InvoicesService,
    private titleService: Title,
    private hostService: HostService,
    private userService: UserService,
    private paymentService: PaymentService,
    private notificationsService: PopInNotificationConnectorService
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Invoices`);
    this.casesService.getCaseId.pipe(takeUntil(this.destroyComponent)).subscribe(res => {
      const invoiceSubmitWord = 'invoice-submit/';
      const invoiceIndex = this.router.url.indexOf(invoiceSubmitWord);

      this.invoiceId = this.router.url.slice(invoiceIndex + invoiceSubmitWord.length);
      this.caseId = res['case_id'];
      this.whoami$ = this.userService.getPossibleVariable(this.caseId as any);

      combineLatest([this.userService.getAuthStatus(), this.invoicesService.getInvoice(this.caseId as any, this.invoiceId)])
        .pipe(takeUntil(this.destroyComponent))
        .subscribe(([whoami, invoice]) => {
          this.invoiceModel = invoice;
          this.systemColors = whoami?.data?.company_system?.design?.colors;
          this.loading = false;
          this.stripe$ = this.getStripe();
        });
    });
  }

  ngOnDestroy() {
    this.destroyComponent.next(true);
    this.destroyComponent.complete();
  }

  public getStripe(): Observable<any> {
    return this.paymentService.getStripe().pipe(
      tap(res => {
        if ((!res.stripe_connect_active || !res.stripe_onboard_completed) && !res?.items?.length) {
          this.paymentService
            .postStripe()
            .pipe(takeUntil(this.destroyComponent))
            .subscribe(res => this.loadStripe(res.client_secret));
        }
      })
    );
  }

  public goToInvoice(): void {
    let tab: string = this.invoicesService.currentTab$.value;
    if (tab === 'all') {
      tab = 'published';
    }
    this.router.navigate(['invoices'], { queryParams: { tab } });
  }

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  public downloadPDF(): void {
    const documentDefinition: any = this.getDocumentDefinition();
    pdfMake.createPdf(documentDefinition).download();
  }

  public getDocumentDefinition() {
    //TODO: help - http://pdfmake.org/playground.htmlconst startIndex = location.href.indexOf('ca-');
    const startIndex = location.href.indexOf('ca-');
    const endIndex = location.href.indexOf('.');
    const hostId = location.href.slice(startIndex, endIndex);
    const formName = this.invoiceModel.name;
    const appName = this.hostService.appName;
    const dueDate = new Date(this.invoiceModel.duration.due_date);
    const content = [
      {
        columns: [
          [
            {
              text: 'Bill To:',
              style: 'label'
            },
            {
              text: `${this.userService.userData?.given_name} ${this.userService.userData?.family_name}`,
              style: 'value'
            }
          ],
          [
            {
              alignment: 'right',
              columns: [
                {
                  text: 'Due Date:',
                  style: 'label'
                },
                {
                  text: dueDate.toDateString(),
                  style: 'value',
                  bold: false
                }
              ]
            },
            {
              background: '#D8D8D8',
              alignment: 'right',
              columns: [
                {
                  text: 'Balance Due:',
                  style: 'value'
                },
                {
                  text: this.calculateTotal(),
                  style: 'value'
                }
              ]
            }
          ]
        ]
      },
      '\n\n\n',
      {
        style: 'tableHeader',
        table: {
          widths: [100, '*', 100, '*', '*'],
          headerRows: 1,
          body: [['Type', 'Item', 'Quantity', 'Rate', 'Amount']]
        },
        layout: 'noBorders'
      },
      {
        style: 'tableBody',
        table: {
          widths: [100, '*', 100, '*', '*'],
          headerRows: 1,
          body: this.invoiceModel.transactions?.transactions?.map((transaction: any) => {
            return [
              transaction.transaction_type,
              transaction.description,
              transaction.quantity,
              transaction.value,
              transaction.quantity * transaction.value
            ];
          })
        },
        layout: 'noBorders'
      },
      '\n\n\n\n\n\n',
      {
        columns: [
          {},
          [
            {
              columns: [
                {
                  text: 'Subtotal:',
                  style: 'label'
                },
                {
                  text: this.calculateSubTotal(),
                  style: 'value'
                }
              ],
              alignment: 'right'
            },
            '\n',
            {
              columns: [
                {
                  text: 'Discount(0%):',
                  style: 'label'
                },
                {
                  text: this.invoiceModel.transactions?.discount,
                  style: 'value'
                }
              ],
              alignment: 'right'
            },
            '\n',
            {
              columns: [
                {
                  text: 'Tax(0%):',
                  style: 'label'
                },
                {
                  text: this.invoiceModel.transactions?.tax,
                  style: 'value'
                }
              ],
              alignment: 'right'
            },
            '\n',
            {
              columns: [
                {
                  text: 'Total:',
                  style: 'label'
                },
                {
                  text: this.calculateTotal(),
                  style: 'value'
                }
              ],
              alignment: 'right'
            }
          ]
        ]
      }
    ];

    return {
      header: function (currentPage: any, pageCount: any, pageSize: any) {
        return {
          columns: [
            {
              text: 'Invoice',
              alignment: 'left',
              style: 'header'
            },
            {
              style: 'subHeader',
              table: {
                body: [
                  [
                    {
                      image: 'favIcon',
                      width: 18,
                      height: 15,
                      alignment: 'center'
                    }
                  ],
                  [
                    {
                      text: appName,
                      alignment: 'center'
                    }
                  ]
                ]
              },
              width: 80,
              alignment: 'right',
              layout: 'noBorders'
            }
          ]
        };
      },
      content: [[...content]],
      footer: function (currentPage: any, pageCount: any) {
        return {
          columns: [
            {
              text: 'Created with caseactive.com',
              alignment: 'left',
              style: 'footer'
            },
            {
              text: `Page ${currentPage.toString()}/${pageCount}`,
              alignment: 'right',
              style: 'footer'
            }
          ]
        };
      },
      pageMargins: [40, 90, 40, 40],
      images: {
        favIcon: APP_FAVICON(hostId)
      },
      styles: {
        header: {
          margin: [40, 40, 0, 0],
          fontSize: 16,
          color: '#4B5153'
        },
        subHeader: {
          margin: [0, 30, 0, 0],
          fontSize: 6,
          color: '#9D9C9C',
          characterSpacing: 1
        },
        footer: {
          margin: [40, 0, 40, 40],
          fontSize: 8,
          heights: 50
        },
        label: {
          fontSize: 16,
          color: '#9D9C9C'
        },
        value: {
          fontSize: 16,
          bold: true,
          color: '#4B5153'
        },
        tableBody: {
          fontSize: 14,
          color: '#9D9C9C'
        },
        tableHeader: {
          bold: true,
          fontSize: 16,
          color: 'white',
          fillColor: '#4B5153'
        }
      }
    };
  }

  public calculateSubTotal(): number {
    let subTotal = 0;
    this.invoiceModel.transactions?.transactions?.forEach((transaction: any) => {
      transaction.transaction_type === 'charge'
        ? (subTotal = subTotal + transaction.quantity * transaction.value)
        : (subTotal = subTotal - transaction.quantity * transaction.value);
    });
    subTotal = this.roundToTwo(subTotal);

    return subTotal / 100;
  }

  public calculateTotal(): number {
    const subTotal = this.calculateSubTotal();
    const discount = this.invoiceModel.transactions?.discount ? this.invoiceModel.transactions.discount : 0;
    const total = subTotal - (subTotal * discount) / 100;
    const tax = this.invoiceModel.transactions?.tax ? this.invoiceModel.transactions.tax : 0;
    return this.roundToTwo(total + (total * tax) / 100);
  }

  public deleteStripe(id: any): void {
    this.paymentService
      .deleteStripe(id)
      .pipe(takeUntil(this.destroyComponent))
      .subscribe(() => (this.stripe$ = this.getStripe()));
  }

  public createNewPayment(): void {
    this.hidePayments = true;

    this.paymentService
      .postStripe()
      .pipe(
        takeUntil(this.destroyComponent),
        catchError(err => {
          this.hidePayments = false;
          return throwError(err);
        })
      )
      .subscribe(res => {
        this.loadStripe(res.client_secret);
      });
  }

  public chooseSubmitRequest(value: boolean): void {
    value ? this.payTheInvoice() : this.createNewStripe();
  }

  public payTheInvoice(): void {
    const notification: Notification = this.notificationsService.addNotification({ title: 'Paying the Invoice' });
    const request = {
      payment_gateway: 'stripe',
      payment_method: this.selectedPaymentId
    };

    this.invoicesService
      .payInvoice(this.caseId as any, request, this.invoiceId as any)
      .pipe(
        takeUntil(this.destroyComponent),
        catchError(err => {
          this.paymentError = err.error.message;
          this.notificationsService.failed(notification, 'Payment Error');
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, 'Invoice Payed');
        this.goToInvoice();
      });
  }

  public onSelectRadio(value: any): void {
    this.selectedPaymentId = value.value;
  }

  public async createNewStripe(): Promise<any> {
    const notification = this.notificationsService.addNotification({
      title: 'Saving Payment Card'
    });
    const elements = this.stripeElements;
    const { error } = await this.stripe.confirmSetup({ elements, redirect: 'if_required' });

    if (error) {
      const messageContainer: any = document.querySelector('#error-message');
      messageContainer.textContent = error.message;

      this.notificationsService.failed(notification, 'Payment Error');
    } else {
      this.stripe$ = this.getStripe();
      this.notificationsService.ok(notification, 'Payment Saved');
      this.hidePayments = false;
    }
  }

  private roundToTwo(num: number) {
    return +(Math.round((num + 'e+2') as any) + 'e-2');
  }

  private loadStripe(clientSecret: string): void {
    // @ts-ignore
    this.stripe = Stripe(environment.STRIPE_PUBLIC_API_KEY);

    const color = this.systemColors?.background ? `rgb(${this.systemColors.background})` : '#16B0C5';
    const options = {
      clientSecret,
      appearance: {
        variables: {
          colorText: '#667074',
          fontFamily: 'Proxima, Arial, Helvetica, sans-serif',
          borderRadius: '4px',
          fontSizeBase: '14px',
          fontSizeSm: '14px',
          focusBoxShadow: `0 0 5px ${color}`,
          colorIconTabSelected: color,
          colorPrimary: color,
          colorBackground: '#F8FAFB'
        },
        rules: {
          '.Input:focus': {
            border: `1px solid ${color}`
          },
          '.Tab--selected': {
            border: `1px solid ${color}`,
            boxShadow: `0 0 5px ${color}`
          },
          '.TabIcon--selected': {
            color: color
          },
          '.TabLabel--selected': {
            color: color
          }
        }
      }
    };

    this.stripeElements = this.stripe.elements(options as any);

    const paymentElement = this.stripeElements?.create('payment' as any);

    paymentElement?.mount('#payment-element');
  }
}
