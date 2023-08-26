import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { InvoiceModel } from '../models/invoice-models';

@Component({
  selector: 'app-invoice-preview',
  templateUrl: './invoice-preview.component.html',
  styleUrls: ['./invoice-preview.component.css']
})
export class InvoicePreviewComponent implements OnInit {
  @Input() invoice?: InvoiceModel;

  private subTotal?: number;

  constructor(public router: Router) {}

  ngOnInit(): void {}

  public calculateSubTotal(): number {
    this.subTotal = 0;
    this.invoice?.transactions?.transactions?.forEach((transaction: any) => {
      transaction.transaction_type === 'charge'
        ? (this.subTotal = this.subTotal! + transaction.quantity! * transaction.value)
        : (this.subTotal = this.subTotal! - transaction.quantity! * transaction.value);
    });
    this.subTotal = this.roundToTwo(this.subTotal);

    return this.subTotal / 100;
  }

  public calculateTotal(): number {
    const discount = this.invoice?.transactions?.discount ? this.invoice.transactions.discount : 0;
    const total = this.subTotal! - (this.subTotal! * discount) / 100;
    const tax = this.invoice?.transactions?.tax ? this.invoice?.transactions.tax : 0;
    return this.roundToTwo((total + (total * tax) / 100) / 100);
  }

  private roundToTwo(num: number) {
    return +(Math.round((num + 'e+2') as any) + 'e-2');
  }
}
