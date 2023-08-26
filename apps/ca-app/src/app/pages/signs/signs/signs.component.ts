import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { catchError, delay, finalize, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { CaseStatus } from '@app/types';

import { SignsService } from '../../../services/signs.service';
import { CasesService } from '../../../services/cases.service';
import { UserService } from '../../../services/user.service';
import { GarbageCollectorService } from '../../../services/garbage-collector.service';
import { StylesService } from '../../../services/styles.service';
import { UtilsService } from '../../../services/utils.service';
import { HostService } from '../../../services/host.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { CreateSignComponent } from '../create-sign/create-sign.component';
import { FormModel } from '../../forms/models/FormModel';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { Person } from '../../../shared/document-forms-builder';

@Component({
  selector: 'app-signs',
  templateUrl: './signs.component.html',
  styleUrls: ['./signs.component.css']
})
export class SignsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(CreateSignComponent)
  createSignComponent?: CreateSignComponent;

  showPendingSigns = true;
  showConfirmedSigns = false;
  showMySigns = false;
  showAllSigns = false;
  loading = true;
  upcomingSigns: any = [];
  teamData: any = {};
  permissions: any = {};
  showModal = false;
  showSignsList = false;
  librarySignsList: any[] = [];
  librarySignsLoading = false;
  showAnswersModal = false;
  answers: any;
  createdByMeFormsControl = new UntypedFormControl(false);
  publishingSign = false;
  userData: any;
  showSignSubmit = false;
  showSignView = false;
  showSignBuilder = false;
  showSignDocument = false;
  selectedSign?: any;
  uploadingSign?: any;
  caseId = '';
  addSignTitle = '';
  signId: any;
  signType: any;
  people: Person[] = [];
  showUploadModal = false;

  publishCheckList: boolean[] = [];
  public currentCaseStatus$: Observable<CaseStatus>;
  public showLoadMore: boolean = false;
  public newElementsSectionIsLoading = false;

  private contentOnloadFnList: any[] = [];
  private signAction?: string | null;
  private unsubscribe$: Subject<void> = new Subject();
  private limitIncrease: number = 50;
  private limit: number = this.limitIncrease;

  constructor(
    public utilsService: UtilsService,
    public stylesService: StylesService,
    private signsService: SignsService,
    private casesService: CasesService,
    private userService: UserService,
    private activateRoute: ActivatedRoute,
    private garbageCollectorService: GarbageCollectorService,
    private router: Router,
    private hostService: HostService,
    private titleService: Title,
    private notificationsService: PopInNotificationConnectorService,
    private errorD: LocalTranslationService
  ) {
    this.currentCaseStatus$ = this.casesService.activeCaseObs$.pipe(map(data => data?.status)) as any;
  }

  ngOnInit() {
    this.activateRoute.queryParams.subscribe(params => {
      const tabParam = params['tab'] || '';
      if (tabParam === 'completed') {
        this.loadCompleteSigns();
      }
      if (tabParam === 'published') {
        this.loadMySigns();
      }
      if (tabParam === 'uncompleted') {
        this.loadIncompleteSigns();
      }
    });
    this.titleService.setTitle(`${this.hostService.appName} | E-signs`);
    this.errorD.loadErrors();

    this.casesService.getCaseId.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      this.caseId = res['case_id'];
      this.loadSigns();
    });

    if (this.userService.rolesPermissions[this.caseId]) {
      this.permissions = {};
      this.userService.rolesPermissions[this.caseId].data.permissions.signs.map((v: any) => {
        this.permissions[v] = v;
      });
    }

    if (this.userService.casePermissionsData) {
      this.permissions = {};

      this.userService.casePermissionsData.role.permissions.signs.map((v: any) => {
        this.permissions[v] = v;
      });
    }

    this.userService.getCasePermissionsData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      this.permissions = {};

      data.role.permissions.signs.map((v: any) => {
        this.permissions[v] = v;
      });
    });

    this.userService.getTeamData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      this.people = data!.items.map((usr: any) => {
        this.teamData[usr.user_id] = usr;

        return {
          id: usr.user_id,
          text: `${usr.given_name} ${usr.family_name}`,
          role_id: usr.role_id
        };
      });
    });

    this.signsService.publishSign$.pipe(takeUntil(this.unsubscribe$)).subscribe(flag => {
      this.togglePublished({ checked: flag }, this.selectedSign);
    });

    this.garbageCollectorService.destroyCommand.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.ngOnDestroy();
    });

    this.signsService.createSignCommand.pipe(takeUntil(this.unsubscribe$)).subscribe(type => {
      switch (type) {
        case 'builder':
          this.openModal(type);
          break;
        case 'document':
          this.openModal(type);
          break;
        case 'SL':
          this.activateSignsFromLibraryPopUp();
          break;
      }
    });

    this.userData = this.userService.userData;
    if (!this.userData) {
      this.userService.getUserData.pipe(takeUntil(this.unsubscribe$)).subscribe(resp => {
        this.userData = resp;
      });
    }

    this.createdByMeFormsControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(value => (value ? this.loadMySignsWithoutAllSigns() : this.loadAllSigns()));
  }

  ngAfterViewInit() {
    this.signsService.signDirectLinkSubject
      .asObservable()
      .pipe(delay(1000), takeUntil(this.unsubscribe$))
      .subscribe(res => {
        if (res?.id) {
          this.signAction = res?.action || null;

          if (res?.action === 'submit') {
            this.loadIncompleteSigns(res?.id);
          } else if (res?.action === 'answers') {
            this.loadAllSigns(res?.id);
          } else if (res?.action === 'media') {
            this.router.navigate([`/e-signs/doc-e-sign-builder/${res.id}`]);
          }

          this.signsService.signDirectLinkSubject.next(null as any);
        }
      });
  }

  public loadMoreEvents(): void {
    this.limit += this.limitIncrease;
    this.newElementsSectionIsLoading = true;

    if (this.showAllSigns) {
      this.renderSigns(this.caseId, 'all')
    } else if (this.showConfirmedSigns) {
      this.renderSigns(this.caseId, 'completed')
    } else if (this.showPendingSigns) {
      this.renderSigns(this.caseId, 'uncompleted')
    } else if (this.showMySigns) {
      this.renderSigns(this.caseId, 'self')
    }
  }

  // Loading incomplete signs
  loadIncompleteSigns(id?: string): void {
    this.onSignClose();
    this.loading = true;
    this.renderSigns(this.caseId, 'uncompleted', id);
    this.showPendingSigns = true;
    this.showMySigns = false;
    this.showConfirmedSigns = false;
    this.showAllSigns = false;
    this.limit = this.limitIncrease;
  }

  // Loading complete signs
  loadCompleteSigns(): void {
    this.onSignClose();
    this.loading = true;
    this.renderSigns(this.caseId, 'completed');
    this.showConfirmedSigns = true;
    this.showMySigns = false;
    this.showPendingSigns = false;
    this.showAllSigns = false;
    this.limit = this.limitIncrease;
  }

  // Loading all signs
  loadAllSigns(id?: string): void {
    this.onSignClose();
    this.loading = true;
    this.renderSigns(this.caseId, 'all', id);
    this.showAllSigns = true;
    this.showMySigns = false;
    this.showConfirmedSigns = false;
    this.showPendingSigns = false;
    this.limit = this.limitIncrease;
  }

  // Loading my signs
  loadMySigns(): void {
    this.onSignClose();
    this.loading = true;
    this.renderSigns(this.caseId, 'all');
    this.showMySigns = true;
    this.showAllSigns = false;
    this.showConfirmedSigns = false;
    this.showPendingSigns = false;
    this.limit = this.limitIncrease;
  }

  // Handling loading signs
  loadSigns(): void {
    if (this.showPendingSigns) {
      this.loadIncompleteSigns();
    } else if (this.showConfirmedSigns) {
      this.loadCompleteSigns();
    } else if (this.showMySigns) {
      this.loadMySigns();
    } else if (this.showAllSigns) {
      this.loadAllSigns();
    }
  }

  togglePublished(element: any, sign: any, index?: number) {
    // const published = element.checked ? 1 : 0;
    const published = sign.published === 0 ? 1 : 0;
    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving e-sign`
    });
    this.publishingSign = true;

    this.signsService
      .publishFormApi(this.caseId, sign.sign_id)
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => {
          this.publishingSign = false;
        })
      )
      .subscribe(
        () => {
          this.notificationsService.ok(notification, 'E-sign Updated');
          sign.published = 1;
        },
        err => {
          if (err.error.error.message === 'SchemaMissingException') {
            notification.width = '450px';

            this.notificationsService.failed(
              notification,
              'You cannot publish an e-sign if there is no field added to it'
            );
          } else if (err.error.error.message === 'SchemaModifyException') {
            this.notificationsService.failed(notification, `An answered e-sign can't be modified`);
          } else {
            this.errorD
              .showError(err.error.error.message)
              .pipe(takeUntil(this.unsubscribe$))
              .subscribe(errorMessage => this.notificationsService.failed(notification, errorMessage));
          }
          sign.published = 0;
        }
      );
  }

  // Deleting sign
  deleteSign(ind: number, signsList: any): void {
    const sign = signsList[ind];
    const removedSign = signsList.splice(ind, 1);

    this.signsService
      .deleteForm(this.caseId, sign.sign_id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {},
        () => signsList.unshift(removedSign)
      );
  }

  // Open sign submit page
  runSignSubmit(sign: any): void {
    // this.selectedSign = sign;
    // this.showSignSubmit = true;
    // location.href = '/e-signs/e-sign-submit/' + sign.sign_id;
    switch (sign.type) {
      case 'builder':
        this.router.navigate(['/e-signs/e-sign-submit/' + sign.sign_id]);
        break;
      case 'document':
        this.router.navigate(['/e-signs/doc-e-sign-submit/' + sign.sign_id]);
        break;
    }
  }

  onSignClose() {
    this.selectedSign = null;
    this.showSignSubmit = false;
    this.showSignView = false;
    this.showSignBuilder = false;
    this.showSignDocument = false;
    this.signsService.toggleSignBuilder(-1);
  }

  // View sign
  runSignView(sign: any, withAnswer: boolean = false): void {
    this.selectedSign = sign;
    this.showSignView = true;
    this.showPendingSigns && this.signsService.currentTab$.next('uncompleted');
    this.showConfirmedSigns && this.signsService.currentTab$.next('completed');
    const viewId = withAnswer ? 1 : 3;
    (this.showAllSigns || this.showMySigns) && this.signsService.currentTab$.next('published');
    switch (sign.type) {
      case 'builder':
        this.router.navigate([`/e-signs/e-sign-view/${sign.sign_id}/${this.userData.user_id}/${viewId}`]);
        break;
      case 'document':
        this.router.navigate([`/e-signs/doc-e-sign-view/${sign.sign_id}/${this.userData.user_id}/${viewId}`]);
        break;
    }
  }

  // Open sign modal window without sign library modal window click on sign element with library forms list
  submitLibrarySign(formItem: any): void {
    const form: FormModel = new FormModel();
    form.name = formItem.tag_id;
    formItem.description ? (form.description = formItem.description) : delete form.description;
    form.media_asset_id = formItem.asset_id;
    formItem.notifications && formItem.notifications.names.length > 0
      ? (form.notifications = formItem.notifications)
      : delete form.notifications;
    formItem.permissions.length > 0 ? (form.permissions = formItem.permissions) : delete form.permissions;
    form.schema = formItem.schema && formItem.schema.schema;
    form.duration = {
      due_date: new Date().toISOString(),
      rrule: formItem.rrule
    };
    form.pages = formItem.pages;
    formItem.media.images.ct || formItem.media.docs.ct ? (form.type = 'document') : (form.type = 'builder');

    this.showSignsList = false;
    this.openModal(form, true);
  }

  // Close sign library pop-up
  closeFilesPopUp(): void {
    this.showSignsList = false;
    this.stylesService.popUpDisactivated();
  }

  // Open sign view
  openSignView(sign: any) {
    switch (sign.type) {
      case 'builder':
        this.router.navigate([`/e-sign-view/${sign.sign_id}`]);
        break;
      case 'document':
        this.router.navigate([`/doc-e-sign-view/${sign.sign_id}`]);
        break;
    }
  }

  openDocSignBuilder(sign: any): void {
    this.router.navigate([`/e-signs/doc-e-sign-builder/${sign.sign_id}`]);
  }

  // Handling open sign builder
  openSignBuilder(sign: any): void {
    // Remove since we move uploading optional page logic
    // if (!sign.media_ct && sign.type === 'document') {
    //   this.openUploadModal(sign);
    // } else {
    switch (sign.type) {
      case 'builder':
        this.selectedSign = sign;
        this.showSignBuilder = true;
        this.signsService.toggleSignBuilder(this.selectedSign.published);
        this.router.navigate([`/e-signs/e-sign-builder/${sign.sign_id}`]);
        break;
      case 'document':
        // this.selectedSign = sign;
        // this.showSignDocument = true;
        this.router.navigate([`/e-signs/doc-e-sign-builder/${sign.sign_id}`]);
        break;
    }
    // }
  }

  // Open sign modal window
  openModal(sign?: any, isLibraryForm?: boolean): void {
    this.createSignComponent?.refreshModal();
    this.createSignComponent!.caseId = this.caseId;
    this.addSignTitle = sign.sign_id ? 'Edit E-sign' : 'Add E-sign';
    this.createSignComponent!.signModel.sign_id = sign.sign_id || '';
    this.createSignComponent!.signModel.type = sign.type || sign;
    isLibraryForm
      ? this.createSignComponent?.loadOpenedSignInformation(sign)
      : this.createSignComponent?.loadOpenedSignInformation();

    this.showModal = true;
    this.createSignComponent!.isOpened = this.showModal;
    this.stylesService.popUpActivated();
  }

  // Close sign modal window
  closeModal(): void {
    this.stylesService.popUpDisactivated();
    this.showModal = false;
    this.createSignComponent!.isOpened = this.showModal;
    this.createSignComponent!.formTouched = false;
  }

  openUploadModal(sign: any): void {
    this.showUploadModal = true;
    this.uploadingSign = sign;
    this.stylesService.popUpActivated();
  }

  // Close upload modal window
  closeUploadModal(): void {
    this.stylesService.popUpDisactivated();
    this.showUploadModal = false;
  }

  public copySign(sign: FormModel): void {
    const notification: Notification = this.notificationsService.addNotification({
      title: `Copying E-sign`
    });
    this.signsService.createForm(this.caseId, { ...sign, published: 0, name: sign.name + '-draft' })
      .pipe(
        take(1),
        switchMap((createdSign) => this.signsService.updateForm(this.caseId, { ...sign, published: 0 }, createdSign.sign_id)),
        catchError((error) => {
          this.notificationsService.failed(notification, `Error during copying E-sign`);
          return error;
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, 'E-sign Copied');
        this.renderSigns(this.caseId, 'all');
      });
  }

  // Loading my signs without all signs
  private loadMySignsWithoutAllSigns(): void {
    this.loading = true;
    this.renderSigns(this.caseId, 'self');
    this.showAllSigns = true;
    this.showMySigns = false;
    this.showConfirmedSigns = false;
    this.showPendingSigns = false;
    this.limit = this.limitIncrease;
  }

  // Base rendering signs
  private renderSigns(caseId: string, filterValue?: any, id?: any): void {
    const onsuccess = (signs: any) => {
      this.showLoadMore = !!signs?.nextLink;
      this.upcomingSigns = this.renderSignsListByComplete(signs.items);
      this.loading = false;
      this.newElementsSectionIsLoading = false;
      this.publishCheckList = [];
      this.upcomingSigns.forEach((element: any) => {
        if (element.published == 1) this.publishCheckList.push(true);
        else this.publishCheckList.push(false);
      });
      this.upcomingSigns.map((sign: any) => (sign.createdByMe = sign.user_id === this.userData['user_id']));

      this.contentOnloadFnList = [];
      if (id) {
        // open forms direct link for view or submit
        if (this.signAction === 'submit' && filterValue === 'uncompleted') {
          const sign = this.upcomingSigns.filter((sign: any) => sign.sign_id === id)[0];

          sign
            ? this.router.navigate(['e-signs/e-sign-builder', id])
            : this.router.navigate([`/e-signs/e-sign-view/${id}/${this.userData.user_id}`]);
        }

        // open forms direct link for answers
        if (this.signAction === 'answers' && filterValue === 'self') {
          const sign = this.upcomingSigns.filter((sign: any) => sign.sign_id === id)[0];

          if (sign) {
            this.answers = sign.answers;
            this.signId = sign.sign_id;
            this.signType = sign.type;
            this.showAnswersModal = true;
          }
        }
      }
    };

    this.contentOnloadFnList.map((v, i) => {
      this.contentOnloadFnList[i].canRun = false;
    });

    const ln = this.contentOnloadFnList.length;
    const obj = {
      canRun: true,
      fn: (signs: any) => {
        if (obj.canRun) {
          onsuccess(signs);
        }
      }
    };

    this.contentOnloadFnList.push(obj);

    this.signsService
      .getForms(caseId, filterValue, this.limit)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (signs: any) => {
          this.contentOnloadFnList[ln].fn(signs);
          // if (!signs.currentItemCount && filterValue === 'uncompleted') {
          //   setTimeout(() => {
          //     if (this.permissions['moderate_others']) {
          //       this.loadAllSigns();
          //     } else if (this.permissions['manage_own'] && !this.permissions['moderate_others']) {
          //       this.loadMySigns();
          //     }
          //   }, 1500);
          // }
        },
        err => {
          this.loading = false;
          this.upcomingSigns = [];
        }
      );
  }

  // Rendering sign list by status complete
  private renderSignsListByComplete(items: any): any[] {
    const returnRecentSignsList: any[] = [];

    items
      .sort((a: any, b: any) => {
        const aD = new Date(a),
          bD = new Date(b);

        return aD < bD ? -1 : 1;
      })
      .map((r: any) => {
        returnRecentSignsList.push(r);
      });

    return returnRecentSignsList;
  }

  // Open library sign modal window
  private activateSignsFromLibraryPopUp(): void {
    this.showSignsList = true;
    this.stylesService.popUpActivated();
    this.librarySignsLoading = true;
    this.signsService
      .getLibrarySigns(this.caseId)
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.librarySignsLoading = false))
      )
      .subscribe(({ items }) => (this.librarySignsList = items));
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    this.signsService.toggleSignBuilder(-1);
    this.upcomingSigns = [];
    this.showSignsList = false;
    this.librarySignsLoading = false;
  }
}
