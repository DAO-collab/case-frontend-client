import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AdminService } from '../../../services/admin.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { OptionsService } from '../../../services/options.service';
import { HostService } from '../../../services/host.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { catchError, takeUntil } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { PopInNotificationConnectorService } from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-module-settings',
  templateUrl: './module-settings.component.html',
  styleUrls: ['./module-settings.component.css']
})
export class ModuleSettingsComponent extends UnsubscriptionHandler implements OnInit {
  public loading = true;
  public message = false;
  public saving = false;
  public formError = '';
  public selectedModules: any;
  public allModules: { formControl: string; name: string }[] = [];
  public modulesForm = this.formBuilder.group({});

  constructor(
    private errorD: LocalTranslationService,
    private adminService: AdminService,
    private optionsService: OptionsService,
    private titleService: Title,
    private hostService: HostService,
    private formBuilder: UntypedFormBuilder,
    private notificationsService: PopInNotificationConnectorService
  ) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Modules`);

    this.optionsService
      .moduleNamesList()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        Object.keys(res).forEach(key => {
          this.modulesForm.addControl(key, new UntypedFormControl(false));
          this.allModules.push({ formControl: key, name: res[key] });
        });
        this.selectedModules = this.hostService.modules;
        this.selectedModules.forEach((moduleName: string) => this.modulesForm.get(moduleName)?.setValue(true));
        this.loading = false;
      });
  }

  public save(): string | void {
    this.message = false;
    this.formError = '';
    const formValue = this.modulesForm.value;
    const modules: any = Object.keys(formValue).reduce((acc: any, cur) => [...acc, ...(!!formValue[cur] ? [cur] : [])], []);

    const notification = this.notificationsService.addNotification({
      title: 'Updating settings'
    });

    if (!modules.length) {
      return (this.formError = 'Select at least one module, please.');
    }

    this.saving = true;

    this.adminService
      .updateModules({ modules })
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.saving = false;
          this.errorD.showError(res.message).subscribe(errorMessage => {
            this.formError = errorMessage;
          });
          this.notificationsService.failed(notification, res.message);
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.message = true;
        this.saving = false;
        this.notificationsService.ok(notification, 'Modules settings updated');
      });
  }
}
