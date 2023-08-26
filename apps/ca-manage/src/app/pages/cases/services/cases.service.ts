import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../../shared/constants.utils';
import { IApiGridResponse } from '../../../interfaces/api-response.model';
import {
  ICase,
  ICreateCaseRelation,
  ICaseDefaultResponse,
  ICaseAssignedUser,
  CaseStatus,
  CaseSearchAttribute,
  IAssignUser
} from '../models/case.model';
import { Observable, Subject } from 'rxjs/index';
import { pluck } from 'rxjs/operators';
import { IForm } from '../../../services/forms.service';

@Injectable()
export class CasesService {
  private withCredentials = { withCredentials: true };
  private casesFilterSubject: Subject<CaseStatus> = new Subject();
  private changeAddUserModalStateSubject: Subject<any> = new Subject();
  public changeAddUserModalStateSub: Observable<any> = this.changeAddUserModalStateSubject.asObservable();
  private changeAddTemplateModalStateSubject: Subject<any> = new Subject();
  public changeAddTemplateModalStateSub: Observable<any> = this.changeAddTemplateModalStateSubject.asObservable();
  private changeAddCaseModalStateSubject: Subject<any> = new Subject();
  public changeAddCaseModalStateSub: Observable<any> = this.changeAddCaseModalStateSubject.asObservable();
  public casesFilterSub: Observable<CaseStatus> = this.casesFilterSubject.asObservable();
  public subMenuItem = CaseStatus.Active;

  constructor(private http: HttpClient) {}

  public setCasesFilter(value: CaseStatus) {
    this.subMenuItem = value;
    this.casesFilterSubject.next(value);
  }

  /**
   * Change Add User Modal State
   */
  public changeAddUserModalState() {
    this.changeAddUserModalStateSubject.next();
  }

  /**
   * Change Add Template Modal State
   */
  public changeAddTemplateModalState() {
    this.changeAddTemplateModalStateSubject.next();
  }

  /**
   * Change Add Case Modal State
   */
  public changeAddCaseModalState() {
    this.changeAddCaseModalStateSubject.next();
  }

  /**
   * Create case
   * @param data: ICase
   */
  public createCase(data: ICase): Observable<ICaseDefaultResponse> {
    return this.http.post<ICaseDefaultResponse>(API_URL('/cases'), data, this.withCredentials).pipe(pluck('data'));
  }

  /**
   * Get cases
   */
  public fetchCases(): Observable<IApiGridResponse<ICase[]>> {
    return this.http.get<IApiGridResponse<ICase[]>>(API_URL('/cases'), this.withCredentials).pipe(pluck('data'));
  }

  /**
   * Get case
   * @param caseId: string
   */
  public getCase(caseId: string): Observable<ICase> {
    return this.http.get<ICase>(API_URL(`/cases/${caseId}`), this.withCredentials).pipe(pluck('data'));
  }

  /**
   * Update case
   * @param caseId: string
   * @param data: ICase
   */
  public updateCase(caseId: string, data: ICase): Observable<ICase> {
    return this.http.put<ICase>(API_URL(`/cases/${caseId}`), data, this.withCredentials);
  }

  /**
   * Search cases
   * @param caseStatus: CaseStatus
   * @param attribute: CaseSearchAttribute
   * @param val: string
   */
  public searchCases(
    caseStatus: CaseStatus,
    attribute: CaseSearchAttribute,
    value: string
  ): Observable<IApiGridResponse<ICase[]>> {
    const valueQuery = value ? '&value=' + value : '';

    return this.http
      .get<IApiGridResponse<ICase[]>>(
        API_URL(`/cases/search?case_status=${caseStatus}&attribute=${attribute}${valueQuery}`),
        this.withCredentials
      )
      .pipe(pluck('data'));
  }

  public searchMoreCases(startKey: string): Observable<IApiGridResponse<ICase[]>> {
    return this.http
      .get<IApiGridResponse<ICase[]>>(API_URL(`/cases/?start_key=${startKey}`), this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * Get assigned users to specific case
   * @param caseId: string
   */
  public assignedUsers(caseId: string): Observable<IApiGridResponse<ICaseAssignedUser[]>> {
    return this.http
      .get<IApiGridResponse<ICaseAssignedUser[]>>(API_URL(`/cases/permissions?case_id=${caseId}`), this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * Add user to the case
   * @param relationData: ICreateCaseRelation
   */
  public addCaseRelation(relationData: ICreateCaseRelation): Observable<ICaseDefaultResponse> {
    return this.http.post<ICaseDefaultResponse>(API_URL('/cases/permissions'), relationData, this.withCredentials);
  }

  /**
   * Delete Case Relation - delete related to case user
   * @param caseId: string
   * @param userId: string
   */
  public deleteCaseRelation(caseId: string, userId: string): Observable<any> {
    return this.http.delete(API_URL(`/cases/permissions/${caseId}/${userId}`), this.withCredentials);
  }

  /**
   * Add user to the case
   * @param relationData: ICreateCaseRelation
   */
  public addAssignUser(request: any): Observable<any> {
    return this.http.put(API_URL('/settings/actions'), request, this.withCredentials);
  }

  public deleteAssignUser(): Observable<any> {
    return this.http.delete(API_URL(`/settings/actions`), this.withCredentials);
  }

  public addAfterAction(request: any): Observable<any> {
    return this.http.put(API_URL('/settings/actions'), request, this.withCredentials);
  }

  public deleteAfterAction(actionType: string, caseType: string): Observable<any> {
    return this.http.delete(API_URL(`/settings/actions`), {
      withCredentials: true,
      body: {
        action_type: actionType,
        case_type: caseType
      }
    });
  }

  public getAfterAction(actionType: string): Observable<any> {
    return this.http
      .get(API_URL(`/settings/actions?action_type=${actionType}`), this.withCredentials)
      .pipe(pluck('data'));
  }
}
