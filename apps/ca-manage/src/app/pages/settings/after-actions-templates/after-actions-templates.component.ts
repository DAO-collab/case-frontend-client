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
import { ITask, TasksService } from '../../../services/tasks.service';

@Component({
  selector: 'app-after-actions-templates',
  templateUrl: './after-actions-templates.component.html',
  styleUrls: ['./after-actions-templates.component.css']
})
export class AfterActionsTemplates extends UnsubscriptionHandler implements OnInit {
  shownAddModal = false;
  saving = false;
  loading = true;
  isOpenDropDown = false;
  formTouched = false;
  assignUserForm = this.formBuilder.group({
    role_id: [[], Validators.required],
    form_id: [],
    sign_id: [],
    task_id: [],
    post_id: [],
    case_type: [[], Validators.required],
    operation_order: [[], Validators.required]
  });
  rolesSelectList: object[] = [];
  rolesById: any = {};
  rolesTypeById: any = {};
  validationErrors: any = [];
  forms: IForm[] = [];
  formsSelectList: object[] = [];
  formsById: any = {};
  signs: ISign[] = [];
  signsSelectList: object[] = [];
  signsById: any = {};
  tasks: ITask[] = [];
  tasksSelectList: object[] = [];
  tasksById: any = {};
  feedPosts: IFeedPost[] = [];
  feedPostsSelectList: object[] = [];
  postsById: any = {};
  templateList: any[] = [];
  roleId = '';
  public operationOrderList: any[] = [];
  public caseTypeList = [];
  private roles: any[] = [];

  constructor(
    private titleService: Title,
    private hostService: HostService,
    private formBuilder: UntypedFormBuilder,
    private rolesService: RolesService,
    private notificationConnectorService: PopInNotificationConnectorService,
    private formsService: FormsService,
    private signsService: SignsService,
    private contentMediaService: ContentMediaService,
    private translateService: LocalTranslationService,
    private designService: DesignService,
    private casesService: CasesService,
    private tasksService: TasksService
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

    this.operationOrderList = ['forms', 'posts', 'signs', 'tasks'].map(element => {
      return { text: `${element.charAt(0).toUpperCase()}${element.slice(1)}`, id: element };
    });

    this.designService.getCompanyInfo().subscribe(response => {
      let caseTypes = response?.case_types || [];
      caseTypes = ['all'].concat(caseTypes);
      this.caseTypeList = caseTypes.map((element: any) => {
        return { text: `${element.charAt(0).toUpperCase()}${element.slice(1)}`, id: element };
      });
    });
    this.casesService.changeAddTemplateModalStateSub.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.shownAddModal = !this.shownAddModal;
    });
    this.onLoadActions(true);
  }

  createActions() {
    this.formTouched = true;
    if (this.assignUserForm.invalid) {
      return;
    }
    if (
      this.assignUserForm.value.form_id === null &&
      this.assignUserForm.value.post_id === null &&
      this.assignUserForm.value.sign_id === null &&
      this.assignUserForm.value.task_id === null
    ) {
      return;
    }
    this.saving = true;
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: 'Creating Actions'
    });
    this.roleId = this.assignUserForm.value.role_id;
    const saveData: any = {};
    if (this.assignUserForm.value.form_id) {
      saveData['forms'] = this.assignUserForm.value.form_id;
    }
    if (this.assignUserForm.value.post_id) {
      saveData['posts'] = this.assignUserForm.value.post_id;
    }
    if (this.assignUserForm.value.sign_id) {
      saveData['signs'] = this.assignUserForm.value.sign_id;
    }
    if (this.assignUserForm.value.sign_id) {
      saveData['tasks'] = this.assignUserForm.value.task_id;
    }
    const newValue = {
      order: this.assignUserForm.value.operation_order,
      role_id: this.roleId,
      templates: saveData
    };
    const oldData = this.templateList.filter(list => list.case_type == this.assignUserForm.value.case_type);
    const formValue: any = { add_templates: [...(oldData?.length ? oldData[0].value : []), newValue] };
    if (this.assignUserForm.value.case_type !== 'all') {
      formValue['case_type'] = this.assignUserForm.value.case_type;
    }
    this.casesService
      .addAfterAction(formValue)
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
        this.notificationConnectorService.ok(notification, ' Template Added! ');
      });
  }

  private savingSuccessActions() {
    this.formTouched = false;
    this.validationErrors = [];
    this.onLoadActions(true);
  }

  private onLoadActions(silent?: boolean) {
    this.getRoles();
    this.getForms();
    this.getFeedPosts();
    this.getSigns();
    this.getTasks();
    this.getTemplates();
  }

  public getTemplates() {
    this.casesService
      .getAfterAction(AfterActionType.AddTemplates)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: any) => {
        this.templateList = data.items.length ? data.items.map((item: any) => item) : [];
        this.loading = false;
      });
  }

  public runRemove(caseTypdId: string) {
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: 'Removing Added Templates'
    });

    this.casesService
      .deleteAfterAction(AfterActionType.AddTemplates, caseTypdId)
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

  getRoles() {
    this.rolesService
      .getRoles()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => throwError(res.error))
      )
      .subscribe(data => {
        this.roles = data.items.filter(v => v.role_id !== 'role::bots');
        this.rolesSelectList.splice(this.rolesSelectList.length * -1);
        this.roles.forEach(v => {
          this.rolesById[v.role_id] = v.name;
          this.rolesTypeById[v.role_id] = v.role_type;
          this.rolesSelectList.push({ text: v.name, id: v.role_id });
        });
        this.loading = false;
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

  public getForms() {
    this.formsService
      .getFormsFilter('completed')
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe((res: any) => {
        this.forms = res.items;
        this.formsSelectList.splice(this.formsSelectList.length * -1);
        this.forms.forEach((v: any) => {
          this.formsById[v.asset_id] = v.tag_id;
          this.formsSelectList.push({ text: v.tag_id, id: v.asset_id });
        });
      });
  }

  public getSigns() {
    this.signsService
      .getSignsFilter('completed')
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe((res: any) => {
        this.signs = res.items;
        this.signsSelectList.splice(this.signsSelectList.length * -1);
        this.signs.forEach((v: any) => {
          this.signsById[v.asset_id] = v.tag_id;
          this.signsSelectList.push({ text: v.tag_id, id: v.asset_id });
        });
      });
  }

  public getTasks(): void {
    this.tasksService
      .getTasksFilter('completed')
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe((res: { items: ITask[] }) => {
        this.tasks = res.items;
        this.tasksSelectList.splice(this.tasksSelectList.length * -1);
        this.tasks.forEach(task => {
          this.tasksById[task.asset_id!] = task.tag_id;
          this.tasksSelectList.push({ text: task.tag_id, id: task.asset_id });
        });
      });
  }

  closeAssignPopUp() {
    this.shownAddModal = false;
    this.assignUserForm.reset();
  }
}
