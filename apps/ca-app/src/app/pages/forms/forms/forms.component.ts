import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { catchError, delay, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { CaseStatus } from '@app/types';

import { GarbageCollectorService } from '../../../services/garbage-collector.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { CreateFormComponent } from '../create-form/create-form.component';
import { StylesService } from '../../../services/styles.service';
import { FormsService } from '../../../services/forms.service';
import { CasesService } from '../../../services/cases.service';
import { Person } from '../../../shared/document-forms-builder';
import { UtilsService } from '../../../services/utils.service';
import { UserService } from '../../../services/user.service';
import { HostService } from '../../../services/host.service';
import { FormModel } from '../models/FormModel';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-forms',
  templateUrl: './forms.component.html',
  styleUrls: ['./forms.component.css']
})
export class FormsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(CreateFormComponent)
  createFormComponent?: CreateFormComponent;
  libraryFormsList: any[] = [];
  libraryFormsLoading = false;
  showPendingForms = true;
  showConfirmedForms = false;
  showAllForms = false;
  showMyForms = false;
  showFormsList = false;
  permissions: any = {};
  loading = true;
  upcomingForms: any = [];
  teamData: any = {};
  showModal = false;
  showUploadModal = false;
  showAnswersModal = false;
  answers: any;
  formId: any;
  formType: any;
  showCreatedByMe = false;
  createdByMeFormsControl = new UntypedFormControl(false);
  publishingForm = false;
  userData: any;
  showFormSubmit = false;
  showFormView = false;
  showFormBuilder = false;
  showFormDocument = false;
  selectedForm?: any;
  uploadingForm?: any;
  caseId = '';
  addFormTitle = '';
  people: Person[] = [];
  formPublishList: boolean[] = [];
  public currentCaseStatus$: Observable<CaseStatus | undefined>;
  public showLoadMore: boolean = false;
  public newElementsSectionIsLoading = false;

  private contentOnloadFnList: any[] = [];
  private unsubscribe$: Subject<void> = new Subject();
  private formAction?: string | null;
  private limitIncrease: number = 50;
  private limit: number = this.limitIncrease;
  
  constructor(
    public utilsService: UtilsService,
    public stylesService: StylesService,
    private router: Router,
    private titleService: Title,
    private userService: UserService,
    private hostService: HostService,
    private formsService: FormsService,
    private casesService: CasesService,
    private activateRoute: ActivatedRoute,
    private errorD: LocalTranslationService,
    private garbageCollectorService: GarbageCollectorService,
    private notificationsService: PopInNotificationConnectorService
  ) {
    this.currentCaseStatus$ = this.casesService.activeCaseObs$.pipe(map(data => data?.status));
  }

  ngOnInit() {
    this.activateRoute.queryParams.subscribe(params => {
      const formIdParam = params['form'] || '';
      if (formIdParam) {
        this.router.navigate([`/forms/form-builder/${formIdParam}`]);
      }
      const tabParam = params['tab'] || '';
      if (tabParam === 'completed') {
        this.loadCompleteForms();
      }
      if (tabParam === 'published') {
        this.loadMyForms();
      }
      if (tabParam === 'uncompleted') {
        this.loadIncompleteForms();
      }
    });
    this.titleService.setTitle(`${this.hostService.appName} | Forms`);
    this.loading = true;
    this.stylesService.popUpDisactivated();
    this.errorD.loadErrors();

    this.casesService.getCaseId.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      this.caseId = res['case_id'];
      this.loadForms();
    });

    if (this.userService.rolesPermissions[this.caseId]) {
      this.permissions = {};
      this.userService.rolesPermissions[this.caseId].data.permissions.forms.map((v: any) => {
        this.permissions[v] = v;
      });
    }

    if (this.userService.casePermissionsData) {
      this.permissions = {};

      this.userService.casePermissionsData.role.permissions.forms.map((v: any) => {
        this.permissions[v] = v;
      });
    }

    this.userService.getCasePermissionsData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      this.permissions = {};

      data.role.permissions.forms.map((v: any) => {
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

    this.garbageCollectorService.destroyCommand.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.ngOnDestroy();
    });

    this.formsService.createFormCommand.pipe(takeUntil(this.unsubscribe$)).subscribe(type => {
      switch (type) {
        case 'builder':
          this.openModal(type);
          break;
        case 'document':
          this.openModal(type);
          break;
        case 'FL':
          this.activateFormsFromLibraryPopUp();
          break;
      }
    });

    this.formsService.publishForm$.pipe(takeUntil(this.unsubscribe$)).subscribe(flag => {
      this.togglePublished({ checked: flag }, this.selectedForm);
    });

    this.userData = this.userService.userData;

    if (!this.userData) {
      this.userService.getUserData.pipe(takeUntil(this.unsubscribe$)).subscribe(resp => {
        this.userData = resp;
      });
    }

    this.createdByMeFormsControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(value => (value ? this.loadMyFormsWithoutAllForms() : this.loadAllForms()));
  }

  ngAfterViewInit() {
    this.formsService.formDirectLinkSubject
      .asObservable()
      .pipe(delay(1000), takeUntil(this.unsubscribe$))
      .subscribe(res => {
        if (res?.id) {
          this.formAction = res?.action || null;

          if (res?.action === 'submit') {
            this.loadIncompleteForms(res?.id);
          } else if (res?.action === 'answers') {
            this.loadAllForms(res?.id);
          } else if (res?.action === 'media') {
            this.router.navigate([`/forms/doc-form-builder/${res.id}`]);
          }

          this.formsService.formDirectLinkSubject.next(null);
        }
      });
  }

  togglePublished(element: any, form: any, index?: number) {
    // const published = element.checked ? 1 : 0;
    const published = form.published === 0 ? 1 : 0;
    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving form`
    });
    if (!form.participants_ids) {
      this.notificationsService.failed(notification, 'For publishes first select the person to answer');
      this.formPublishList[index as number] = false;
      return;
    }
    this.publishingForm = true;
    this.formsService.publishFormApi(this.caseId, form.form_id).pipe(
      take(1)
    ).subscribe(
      () => {
        this.notificationsService.ok(notification, 'Form Updated');
        // this.router.navigate(['/forms']);
        form.published = 1;
        this.publishingForm = false;
      },
      err => {
        this.publishingForm = false;
        form.published = 0;
        if (err.error.error.message === 'SchemaMissingException') {
          notification.width = '450px';

          this.notificationsService.failed(
            notification,
            'You cannot publish a form if there is no field added to it'
          );
        } else if (err.error.error.message === 'SchemaModifyException') {
          this.notificationsService.failed(notification, `An answered form can't be modified`);
        } else {
          this.errorD
            .showError(err.error.error.message)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(errorMessage => this.notificationsService.failed(notification, errorMessage));
        }
      }
    );
  }

  // Handling click on form with library form list
  submitLibraryForm(formItem: any): void {
    const form: FormModel = new FormModel();
    form.name = formItem.tag_id;
    formItem.description ? (form.description = formItem.description) : delete form.description;
    form.media_asset_id = formItem.asset_id;
    formItem.notifications && formItem.notifications.names?.length > 0
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

    this.showFormsList = false;
    this.openModal(form, true);
  }

  // Close forms library pop-up
  closeFilesPopUp(): void {
    this.showFormsList = false;
    this.stylesService.popUpDisactivated();
  }

  public loadMoreForms(): void {
    this.limit += this.limitIncrease;
    this.newElementsSectionIsLoading = true;

    if (this.showAllForms) {
      this.renderForms(this.caseId, 'all')
    } else if (this.showConfirmedForms) {
      this.renderForms(this.caseId, 'completed')
    } else if (this.showPendingForms) {
      this.renderForms(this.caseId, 'uncompleted')
    }
  }

  // Loading incomplete forms
  loadIncompleteForms(id?: number): void {
    this.onFormClose();
    this.loading = true;
    this.renderForms(this.caseId, 'uncompleted', id);
    this.showPendingForms = true;
    this.showMyForms = false;
    this.showConfirmedForms = false;
    this.showAllForms = false;
    this.limit = this.limitIncrease;
  }

  // Loading complete forms
  loadCompleteForms(): void {
    this.onFormClose();
    this.loading = true;
    this.renderForms(this.caseId, 'completed');
    this.showConfirmedForms = true;
    this.showMyForms = false;
    this.showPendingForms = false;
    this.showAllForms = false;
    this.limit = this.limitIncrease;
  }

  // Loading all forms
  loadAllForms(id?: any): void {
    this.onFormClose();
    this.loading = true;
    this.renderForms(this.caseId, 'all', id);
    this.showAllForms = true;
    this.showMyForms = false;
    this.showConfirmedForms = false;
    this.showPendingForms = false;
    this.limit = this.limitIncrease;
  }

  // Loading my forms
  loadMyForms(): void {
    this.onFormClose();
    this.loading = true;
    this.renderForms(this.caseId, 'all');
    this.showMyForms = true;
    this.showAllForms = false;
    this.showConfirmedForms = false;
    this.showPendingForms = false;
    this.limit = this.limitIncrease;
  }

  // Handling loading forms
  loadForms(): void {
    if (this.showPendingForms) {
      this.loadIncompleteForms();
    } else if (this.showConfirmedForms) {
      this.loadCompleteForms();
    } else if (this.showMyForms) {
      this.loadMyForms();
    } else if (this.showAllForms) {
      this.loadAllForms();
    }
  }

  openDocFormBuilder(form: any): void {
    this.router.navigate([`/forms/doc-form-builder/${form.form_id}`]);
  }

  openFormBuilder(form: any): void {
    // Remove since we move uploading optional page logic
    // if (!form.media_ct && form.type === 'document') {
    //   this.openUploadModal(form);
    // } else {
    switch (form.type) {
      case 'builder':
        this.selectedForm = form;
        this.showFormBuilder = true;
        // this.formsService.toggleFormBuilder(this.selectedForm.published);
        this.router.navigate([`/forms/form-builder/${form.form_id}`]);
        break;
      case 'document':
        // this.selectedForm = form;
        // this.showFormDocument = true;
        this.router.navigate([`/forms/doc-form-builder/${form.form_id}`]);
        break;
    }
    // }
  }

  // Deleting form
  deleteForm(ind: number, formsList: any[]): void {
    const form = formsList[ind];

    const removedForm = formsList.splice(ind, 1);
    localStorage.removeItem('form_model-' + form.form_id);
    this.formsService
      .deleteForm(this.caseId, form.form_id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {},
        () => formsList.unshift(removedForm)
      );
  }

  // Submiting form
  runFormSubmit(form: any): void {
    switch (form.type) {
      case 'builder':
        this.router.navigate([`/forms/form-submit/${form.form_id}`]);
        // this.router.navigate([`/forms/simple-form-builder/${form.form_id}`]);
        break;
      case 'document':
        this.router.navigate([`/forms/doc-form-submit/${form.form_id}`]);
        break;
    }
  }

  onFormClose() {
    this.selectedForm = null;
    this.showFormSubmit = false;
    this.showFormView = false;
    this.showFormBuilder = false;
    this.showFormDocument = false;
    this.formsService.toggleFormBuilder(-1);
  }

  // View form
  runFormView(form: any, withAnswer: boolean = false): void {
    this.selectedForm = form;
    this.showFormView = true;
    this.showPendingForms && this.formsService.currentTab$.next('uncompleted');
    this.showConfirmedForms && this.formsService.currentTab$.next('completed');
    const viewId = withAnswer ? 1 : 3;
    (this.showAllForms || this.showMyForms) && this.formsService.currentTab$.next('published');
    switch (form.type) {
      case 'builder':
        this.router.navigate([`/forms/form-view/${form.form_id}/${this.userData.user_id}/${viewId}`]);
        break;
      case 'document':
        this.router.navigate([`/forms/doc-form-view/${form.form_id}/${this.userData.user_id}/${viewId}`]);
        break;
    }
  }

  // Open modal window
  openModal(form?: any, isLibraryForm?: boolean): void {
    this.createFormComponent?.refreshModal();
    this.createFormComponent!.caseId = this.caseId;
    this.addFormTitle = form.form_id ? 'Edit Form' : 'Add Form';
    this.createFormComponent!.formModel.form_id = form.form_id || '';
    this.createFormComponent!.formModel.type = form.type || form;
    isLibraryForm
      ? this.createFormComponent?.loadOpenedFormInformation(form)
      : this.createFormComponent?.loadOpenedFormInformation();

    this.showModal = true;
    this.createFormComponent!.isOpened = this.showModal;
    this.stylesService.popUpActivated();
  }

  // Close modal window
  closeModal(): void {
    this.stylesService.popUpDisactivated();
    this.showModal = false;
    this.createFormComponent!.isOpened = this.showModal;
    this.createFormComponent!.formTouched = false;
  }

  openUploadModal(form: any): void {
    this.showUploadModal = true;
    this.uploadingForm = form;
    this.stylesService.popUpActivated();
  }

  // Close upload modal window
  closeUploadModal(): void {
    this.stylesService.popUpDisactivated();
    this.showUploadModal = false;
  }

  public copyForm(form: FormModel): void {
    const notification: Notification = this.notificationsService.addNotification({
      title: `Copying form`
    });
    this.formsService.createForm(this.caseId, { ...form, published: 0, name: form.name + '-draft' })
      .pipe(
        take(1),
        switchMap((createdForm) => this.formsService.updateForm(this.caseId, { ...form, published: 0 }, createdForm.form_id)),
        catchError((error) => {
          this.notificationsService.failed(notification, `Error during copying form`);
          return error;
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, 'Form Copied');
        this.renderForms(this.caseId, 'all');
      });
  }

  // Activate forms library pop-up
  private activateFormsFromLibraryPopUp(): void {
    this.showFormsList = true;
    this.stylesService.popUpActivated();
    this.libraryFormsLoading = true;
    this.formsService
      .getLibraryForms(this.caseId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        res => {
          this.libraryFormsLoading = false;
          this.libraryFormsList = res.items;
        },
        () => (this.libraryFormsLoading = false)
      );
  }

  // Loading my forms
  private loadMyFormsWithoutAllForms(): void {
    this.loading = true;
    this.renderForms(this.caseId, 'self');
    this.showAllForms = true;
    this.showMyForms = false;
    this.showConfirmedForms = false;
    this.showPendingForms = false;
  }

  // Base rendering forms
  private renderForms(caseId: string, filterValue?: string, id?: number): void {
    const onsuccess = (forms: any) => {
      this.showLoadMore = !!forms?.nextLink;
      this.upcomingForms = this.renderFormsListByComplete(forms.items);
      
      this.formPublishList = [];
      this.upcomingForms.forEach((element: any) => {
        if (element.published == 1) this.formPublishList.push(true);
        else this.formPublishList.push(false);
      });
      this.newElementsSectionIsLoading = false;
      this.loading = false;

      this.upcomingForms.map((form: any) => (form.createdByMe = form.user_id === this.userData['user_id']));

      this.contentOnloadFnList = [];

      if (id) {
        // open forms direct link for view or submit
        if (this.formAction === 'submit' && filterValue === 'uncompleted') {
          const form = this.upcomingForms.filter((form: any) => form.form_id === id)[0];

          form
            ? this.router.navigate(['forms/form-submit', id])
            : this.router.navigate([`/forms/form-view/${id}/${this.userData.user_id}`]);
        }

        // open forms direct link for answers
        if (this.formAction === 'answers' && filterValue === 'self') {
          const form = this.upcomingForms.filter((form: any) => form.form_id === id)[0];

          if (form) {
            this.answers = form.answers;
            this.formId = form.form_id;
            this.formType = form.type;
            this.showAnswersModal = true;
          }
        }
      }
    };

    this.contentOnloadFnList.map((v, i) => {
      this.contentOnloadFnList[i].canRun = false;
    });

    const ln = this.contentOnloadFnList.length,
      obj = {
        canRun: true,
        fn: (forms: any) => {
          if (obj.canRun) {
            onsuccess(forms);
          }
        }
      };

    this.contentOnloadFnList.push(obj);
    this.formsService
      .getForms(caseId, filterValue as any, this.limit)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (forms: any) => {
          this.contentOnloadFnList[ln]?.fn(forms);
          // if (!forms.currentItemCount && filterValue === 'uncompleted') {
          //   setTimeout(() => {
          //     if (this.permissions['moderate_others']) {
          //       this.loadAllForms();
          //     } else if (this.permissions['manage_own'] && !this.permissions['moderate_others']) {
          //       this.loadMyForms();
          //     }
          //   }, 1500);
          // }
        },
        () => {
          this.loading = false;
          this.upcomingForms = [];
        }
      );
  }

  // Renredirng forms by status complete
  private renderFormsListByComplete(items: any[]): any[] {
    return items
      .sort((a, b) => (new Date(a) < new Date(b) ? -1 : 1))
      .map(form => {
        if (form.user_id === this.userData.user_id) {
          this.showCreatedByMe = true;
        }

        return form;
      });
  }

  ngOnDestroy(): void {
    this.upcomingForms = [];
    this.showFormsList = false;
    this.stylesService.popUpDisactivated();
    this.libraryFormsLoading = false;
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.formsService.toggleFormBuilder(-1);
  }
}
