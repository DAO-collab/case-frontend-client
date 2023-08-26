import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { HostService } from '../../../../services/host.service';
import { RolesService } from '../../../roles/services/roles.service';
import { FormsService, IForm } from '../../../../services/forms.service';
import { UnsubscriptionHandler } from '../../../../shared/classes/unsubscription-handler';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { FeedPostStatus, IFeedPost, MediaStatus } from '../../../modules/media/models/media.model';
import { ISign, SignsService } from '../../../../services/signs.service';
import { ContentMediaService } from '../../../../services/content-media.service';
import { LocalTranslationService } from '../../../../services/local-translation.service';

@Component({
  selector: 'app-case-user',
  templateUrl: './case-user.component.html',
  styleUrls: ['./case-user.component.css']
})
export class CaseUserComponent extends UnsubscriptionHandler implements OnInit {
  shownAddModal = false;
  saving = false;
  loading = true;
  isOpenDropDown = false;
  formTouched = false;
  assignUserForm = this.formBuilder.group({
    role_id: [[], Validators.required],
    form_id: [],
    sign_id: [],
    post_id: []
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
  feedPosts: IFeedPost[] = [];
  feedPostsSelectList: object[] = [];
  postsById: any = {};
  templateList: any[] = [];
  roleId = '';

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
    private translateService: LocalTranslationService
  ) {
    super();
  }

  ngOnInit(): void {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.shownAddModal) {
        this.closeAssignPopUp();
      }
    });
    this.titleService.setTitle(`${this.hostService.appName} | Cases`);
    this.onLoadActions(true);
  }

  shownAddModalSwitch() {
    this.shownAddModal = true;
  }

  createActions() {
    this.formTouched = true;
    if (this.assignUserForm.invalid) {
      return;
    }
    if (
      this.assignUserForm.value.form_id === null &&
      this.assignUserForm.value.post_id === null &&
      this.assignUserForm.value.sign_id === null
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
    const formValue = { add_templates: saveData, role_type: this.rolesTypeById[this.roleId] };
    this.rolesService
      .updateRole(this.roleId, formValue)
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
        this.notificationConnectorService.ok(notification, ' Assign User Added! ');
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
        this.templateList = data.items.filter((item: any) => {
          if (item['add_templates'] && Object.keys(item['add_templates']).length !== 0) return item['add_templates'];
        });
        this.templateList = this.templateList.map(template => {
          let arrforms = [];
          let arrposts = [];
          let arrsigns = [];
          if (template.add_templates.forms) {
            arrforms = template.add_templates.forms.map((item: any) => {
              return this.formsById[item];
            });
          }
          if (template.add_templates.signs) {
            arrsigns = template.add_templates.signs.map((item: any) => {
              return this.signsById[item];
            });
          }
          if (template.add_templates.posts) {
            arrposts = template.add_templates.posts.map((item: any) => {
              return this.postsById[item];
            });
          }
          return {
            name: template.name,
            role_id: template.role_id,
            role_type: template.role_type,
            forms: arrforms.join(', '),
            signs: arrsigns.join(', '),
            posts: arrposts.join(', ')
          };
        });
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

  runRemove(roleId: string) {
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: 'Removing User For Template'
    });
    const formValue = { add_templates: {}, role_type: this.rolesTypeById[roleId] };
    this.rolesService
      .updateRole(roleId, formValue)
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
        this.onLoadActions(true);
        this.notificationConnectorService.ok(notification, ' Assign User Removed! ');
      });
  }
  closeAssignPopUp() {
    this.shownAddModal = false;
    this.assignUserForm.reset();
  }
}
