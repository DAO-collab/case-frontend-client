import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { concatMap, pluck } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { InvoiceModel } from '../pages/invoice/models/invoice-models';
import { API_URL } from '../utils/constants.utils';
import { TInvoicesUpdate } from './types/invoices-update.type';
import { TInvoiceCurrentTabState } from './types/tab-state.type';

@Injectable({
  providedIn: 'root'
})
export class InvoicesService {
  public activateCreateInvoiceModal = new Subject<any>();
  public dueDateSubject: Subject<string> = new Subject<string>();
  public invoiceDirectLinkSubject: Subject<{ id: string; action: string } | null> = new Subject();
  public currentTab$: BehaviorSubject<TInvoiceCurrentTabState> = new BehaviorSubject<TInvoiceCurrentTabState>('unpaid');

  private formBuilderStateSubject: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient) {}

  public toggleFormBuilder(state: any) {
    this.formBuilderStateSubject.next(state);
  }

  public publishDueDate(dueDate: string) {
    this.dueDateSubject.next(dueDate);
  }

  public activateCreateModal() {
    this.activateCreateInvoiceModal.next(true);
  }

  public getInvoices(caseId: string, filterOptions: string, limit: number = 20): Observable<any> {
    return this.http
      .get(`${API_URL}/${caseId}/invoices?filter=${filterOptions}&limit=${limit}`, this.withCredentials)
      .pipe(pluck('data'));
  }

  public postInvoices(caseId: string, request: InvoiceModel): Observable<any> {
    return this.http.post(`${API_URL}/${caseId}/invoices`, request, this.withCredentials);
  }

  public deleteInvoice(caseId: string, invoiceId: string): Observable<any> {
    return this.http.delete(`${API_URL}/${caseId}/invoices/${invoiceId}`, this.withCredentials);
  }

  public getInvoice(caseId: string, invoiceId: string): Observable<any> {
    return this.http.get(`${API_URL}/${caseId}/invoices/${invoiceId}`, this.withCredentials).pipe(pluck('data'));
  }

  public updateInvoice(
    caseId: string,
    request: InvoiceModel,
    invoiceId: string,
    updateType: TInvoicesUpdate,
    isStatusChanged: boolean = true
  ) {
    let invoiceData: any = request;
    invoiceData = {
      ...invoiceData,
      participants_ids: invoiceData.participants_ids ? invoiceData.participants_ids : []
    };
    let url = `${API_URL}/${caseId}/invoices/${invoiceId}`;
    if (updateType !== 'publish') {
      url += `/${updateType}`;
    }
    if (!isStatusChanged) {
      url = `${API_URL}/${caseId}/invoices/${invoiceId}`;
      delete invoiceData.published;
    }

    if (updateType === 'transactions') {
      const invoiceUrl = `${API_URL}/${caseId}/invoices/${invoiceId}`;
      return this.http.put(url, invoiceData, this.withCredentials).pipe(
        concatMap(() => {
          delete invoiceData.published;
          return this.http.put(invoiceUrl, invoiceData, this.withCredentials);
        })
      );
    }
    return this.http.put(url, invoiceData, this.withCredentials);
  }

  public payInvoice(caseId: string, request: any, invoiceId: string): Observable<any> {
    return this.http.put(`${API_URL}/${caseId}/invoices/${invoiceId}/pay`, request);
  }
}
