import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { CasesService } from './services/cases.service';
import { HostService } from '../../services/host.service';
import { FilterPipe } from '../../common/pipes/filter.pipe';
import { ICase, CaseStatus, CaseSearchAttribute } from './models/case.model';
import { UnsubscriptionHandler } from '../../shared/classes/unsubscription-handler';
import { catchError, takeUntil } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  PopInNotificationConnectorService,
  Notification
} from '../../common/components/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-cases',
  templateUrl: './cases.component.html',
  styleUrls: ['./cases.component.css'],
  providers: [FilterPipe]
})
export class CasesComponent extends UnsubscriptionHandler implements OnInit {
  notFound = false;
  cases: ICase[] = [];
  allCases: ICase[] = [];
  loading = true;
  messages: object = {};
  password: object = {};
  nothingFound = false;
  searchKey = CaseSearchAttribute.TagId;
  CaseSearchAttribute = CaseSearchAttribute;
  searchVal = '';
  showSearchFilter = false;
  caseStatusFilter?: CaseStatus;
  statusNameById: any = {
    0: 'Closed',
    1: 'Active'
  };
  caseSearchForm = this.fb.group({
    searchVal: ['']
  });
  startKey = '';

  get searchValue(): string {
    return this.caseSearchForm.controls['searchVal'].value;
  }

  constructor(
    private casesService: CasesService,
    private filterPipe: FilterPipe,
    private titleService: Title,
    private hostService: HostService,
    private fb: UntypedFormBuilder,
    private notificationConnectorService: PopInNotificationConnectorService
  ) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Cases`);

    this.casesService.casesFilterSub.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      this.caseStatusFilter = res;
      this.nothingFound = false;
      this.loading = true;
      this.searchCasesRequest();
    });

    this.caseSearchForm.controls['searchVal'].valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(searchValue => {
      if (searchValue !== '') {
        this.searchCasesRequest();
      } else {
        this.getCasesAll();
      }
    });

    this.caseStatusFilter = this.casesService.subMenuItem;
    this.getCasesAll();
  }

  closeSearchDropdownOutside(e: any) {
    const dropdown = e.target['closest']('.search-sub-filters'),
      selectionMain = e.target['closest']('.searchKey'),
      dropdownOnpage = document.querySelector('.search-sub-filters');

    if (!dropdown && !selectionMain && dropdownOnpage) {
      this.showSearchFilter = false;
    }
  }

  getCasesAll() {
    this.startKey = '';
    this.casesService
      .fetchCases()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          this.nothingFound = true;

          return throwError(res.error);
        })
      )
      .subscribe((res: any) => {
        this.allCases = res.items;
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        } else {
          this.startKey = '';
        }
        this.cases = this.filterPipe.transform(res.items, { case_status: this.caseStatusFilter }, true);
        this.loading = false;
        this.nothingFound = this.cases.length !== 0 ? false : true;
      });
  }

  /**
   * Search cases by searchVal.
   */
  searchCasesRequest() {
    if (this.searchValue !== '') {
      this.startKey = '';
      this.casesService
        .searchCases(this.caseStatusFilter!, this.searchKey, this.searchValue)
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError(res => {
            this.loading = false;
            this.nothingFound = true;

            return throwError(res.error);
          })
        )
        .subscribe((res: any) => {
          this.allCases = res.items;
          if (res.startKey) {
            this.startKey = encodeURIComponent(res.startKey);
          } else {
            this.startKey = '';
          }
          this.cases = this.filterPipe.transform(res.items, { case_status: this.caseStatusFilter }, true);
          this.loading = false;
          this.nothingFound = this.cases.length !== 0 ? false : true;
        });
    } else {
      this.getCasesAll();
    }
  }

  load_more() {
    this.casesService
      .searchMoreCases(this.startKey)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          this.nothingFound = true;

          return throwError(res.error);
        })
      )
      .subscribe((res: any) => {
        res.items.map((item: any) => {
          this.allCases.push(item);
        });
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        } else {
          this.startKey = '';
        }
        this.cases = this.filterPipe.transform(this.allCases, { case_status: this.caseStatusFilter }, true);
        this.loading = false;
        this.nothingFound = this.cases.length !== 0 ? false : true;
      });
  }

  setSearchKey(key: any) {
    this.searchKey = key;
    this.showSearchFilter = false;
    this.searchCasesRequest();
  }

  searchInputControl(event: any) {
    if (this.searchKey.trim() === '') {
      event.preventDefault();
    }
  }

  copyText(selCase: any): void {
    navigator.clipboard.writeText(selCase.case_id).then();
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: `Case ID Copied`
    });
    this.notificationConnectorService.ok(notification, 'ok');
  }
}
