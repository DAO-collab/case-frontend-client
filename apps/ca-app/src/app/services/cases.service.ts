import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Case } from '@app/interfaces/case.interface';
import { CaseStatus } from '@app/types';
import { IDefaultResponse } from '../interfaces/default-response.interface';
import { API_URL } from '../utils/constants.utils';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { map, pluck } from 'rxjs/operators';

@Injectable()
export class CasesService implements OnInit {
  public caseSubject = new Subject<Case>();
  public activeCase?: Case;
  /*
   * getCaseId - property allows subscribe to case_id
   */
  public getCaseId: Observable<any> = this.caseSubject.asObservable();

  private activeCase$: BehaviorSubject<Case | undefined> = new BehaviorSubject<Case | undefined>(undefined);
  private readonly closedCaseStatus: CaseStatus = 0;
  private readonly openedCaseStatus: CaseStatus = 1;

  public activeCaseObs$: Observable<Case | undefined> = this.activeCase$.asObservable();

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  /*
   * Get Cases - get list of cases
   */
  public getCases(): Observable<IDefaultResponse<Case[]>> {
    return this.http.get<IDefaultResponse<Case[]>>(`${API_URL}/cases`).pipe(pluck('data'));
  }

  /*
   * Get Cases - get list of cases
   */
  public getAllCases(): Observable<{ items: Case[] }> {
    return combineLatest([
      this.http
        .get<{ data: IDefaultResponse<Case[]> }>(`${API_URL}/cases`, { params: { status: this.closedCaseStatus } })
        .pipe(
          map(data => data.data),
          map(data => ({
            ...data,
            items: data.items.map((item: Case) => ({
              ...item,
              status: this.closedCaseStatus
            }))
          }))
        ),
      this.http
        .get<{ data: IDefaultResponse<Case[]> }>(`${API_URL}/cases`, { params: { status: this.openedCaseStatus } })
        .pipe(
          map(data => data.data),
          map(data => ({
            ...data,
            items: data.items.map((item: Case) => ({
              ...item,
              status: this.openedCaseStatus
            }))
          }))
        )
    ]).pipe(
      map(([closed, opened]) => ({
        items: [...closed.items, ...opened.items]
      }))
    );
  }

  /**
   * onCaseIdChange - actions when case is changed
   */
  public changeCaseId(caseId: any) {
    this.activeCase = caseId;
    return this.caseSubject.next(caseId);
  }

  /*
   * getCaseData - get case data by id
   */
  public getCaseData(caseId: any): Observable<any> {
    return this.http.get(`${API_URL}/${caseId}/case`, { withCredentials: true });
  }

  /*
   * updateCaseData -update Case Status
   */
  public updateCaseData(caseId: any, status: any) {
    return this.http.put(`${API_URL}/${caseId}/case`, { case_status: status }, { withCredentials: true });
  }

  /*
   * setCurrentCase - Set Current Case
   */
  public setCurrentCase(currentCase: Case): void {
    this.activeCase$.next(currentCase);
  }
}
