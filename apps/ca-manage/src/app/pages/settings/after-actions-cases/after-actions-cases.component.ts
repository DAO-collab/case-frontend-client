import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { HostService } from '../../../services/host.service';
import { RolesService } from '../../roles/services/roles.service';
import { FormsService, IForm } from '../../../services/forms.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { FeedPostStatus, IFeedPost, MediaStatus } from '../../modules/media/models/media.model';
import { ISign, SignsService } from '../../../services/signs.service';
import { ContentMediaService } from '../../../services/content-media.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { DesignService } from '../../../services/design.service';
import { CasesService } from '../../cases/services/cases.service';
import { AfterActionType } from '../models/after-actions.model';

@Component({
  selector: 'app-after-actions-cases',
  templateUrl: './after-actions-cases.component.html',
  styleUrls: ['./after-actions-cases.component.css']
})
export class AfterActionsCases extends UnsubscriptionHandler implements OnInit {
  shownAddModal = false;
  saving = false;
  loading = true;
  isOpenDropDown = false;
  formTouched = false;
  assignUserForm = this.formBuilder.group({
    case_type: [[], Validators.required],
    idle_days: [[], Validators.required],
    post_id: ['']
  });
  rolesById = {};
  rolesTypeById = {};
  validationErrors: any = [];
  forms: IForm[] = [];
  signs: ISign[] = [];
  feedPosts: IFeedPost[] = [];
  feedPostsSelectList: object[] = [];
  postsById: any = {};
  idleCaseList: any[] = [];
  public caseTypeList = [];

  constructor(
    private titleService: Title,
    private hostService: HostService,
    private formBuilder: UntypedFormBuilder,
    private rolesService: RolesService,
    private notificationConnectorService: PopInNotificationConnectorService,
    private contentMediaService: ContentMediaService,
    private translateService: LocalTranslationService,
    private designService: DesignService,
    private casesService: CasesService
  ) {
    super();
  }

  ngOnInit(): void {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.shownAddModal) {
        this.closeAssignPopUp();
      }
    });
    this.titleService.setTitle(`${this.hostService.appName} | Settings`);

    this.designService.getCompanyInfo().subscribe(response => {
      let caseTypes = response?.case_types || [];
      caseTypes = ['all'].concat(caseTypes);
      this.caseTypeList = caseTypes.map((element: any) => {
        return { text: `${element.charAt(0).toUpperCase()}${element.slice(1)}`, id: element };
      });
    });
    this.casesService.changeAddCaseModalStateSub.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.shownAddModal = !this.shownAddModal;
    });
    this.onLoadActions(true);
  }

  createActions() {
    this.formTouched = true;
    if (this.assignUserForm.invalid) {
      return;
    }
    this.saving = true;
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: 'Creating Actions'
    });

    const saveData = {
      idle_days: this.assignUserForm.value.idle_days,
      post_id: this.assignUserForm.value.post_id
    };
    const oldData: any = this.idleCaseList.filter((list: any) => list.case_type == this.assignUserForm.value.case_type);
    const request: any = { idle_cases:  saveData };

    if (this.assignUserForm.value.case_type !== 'all') {
      request['case_type'] = this.assignUserForm.value.case_type;
    }
    this.contentMediaService
      .getFeedPostsFilter('completed')
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          this.feedPosts = [];
          return throwError(res.error);
        })
      )
      .subscribe(({ items }) => {
        this.feedPosts = items;
        const allowedItem = this.feedPosts.find(item => item.asset_id === saveData['post_id']);
        if (allowedItem?.permissions?.includes('role::bots')) {
          this.casesService
            .addAfterAction(request)
            .pipe(
              takeUntil(this.unsubscribe$),
              catchError(res => {
                if (res.error && res.error.error && res.error.error.message) {
                  this.translateService
                    .showError(res.error.error.message)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(errorMessage => this.notificationConnectorService.failed(notification, errorMessage));
                } else {
                  this.notificationConnectorService.failed(notification, res.message);
                }

                return throwError(res.error);
              })
            )
            .subscribe(() => {
              this.closeAssignPopUp();
              this.savingSuccessActions();
              this.notificationConnectorService.ok(notification, ' Idle Case Added! ');
            });
        }
        else {
          const notification1: Notification = this.notificationConnectorService.addNotification({
            title: "An error occurred. Confirm bot's role is added to the list of users authorized to use this template."
          });
          // this.closeAssignPopUp();
          this.notificationConnectorService.failed(notification1, '');
          return
        }
      });
  }

  private savingSuccessActions() {
    this.formTouched = false;
    this.validationErrors = [];
    this.onLoadActions(true);
  }

  private onLoadActions(silent?: boolean) {
    this.getFeedPosts();
    this.getIdleCase();
  }

  public getIdleCase() {
    this.casesService
      .getAfterAction(AfterActionType.IdleCases)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: any) => {
        this.idleCaseList = data.items.length ? data.items.map((item: any) => item) : [];
        this.loading = false;
      });
  }

  public runRemove(caseTypdId: string) {
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: 'Removing Added Cases'
    });

    this.casesService
      .deleteAfterAction(AfterActionType.IdleCases, caseTypdId)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.saving = false;
          this.loading = false;

          this.notificationConnectorService.failed(notification, 'Failed.');
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.onLoadActions(true);
        this.notificationConnectorService.ok(notification, 'Done.');
      });
  }

  public getFeedPosts() {
    this.contentMediaService
      .getFeedPostsFilter('completed')
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          this.feedPosts = [];
          return throwError(res.error);
        })
      )
      .subscribe(({ items }) => {
        this.feedPosts = items;
        this.feedPostsSelectList.splice(this.feedPostsSelectList.length * -1);
        this.feedPosts.forEach((v: any) => {
          this.postsById[v.asset_id] = v.tag_id;
          this.feedPostsSelectList.push({ text: v.tag_id, id: v.asset_id });
        });
      });
  }

  closeAssignPopUp() {
    this.shownAddModal = false;
    this.assignUserForm.reset();
  }
}
