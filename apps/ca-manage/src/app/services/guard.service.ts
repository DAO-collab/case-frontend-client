import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AdminService, IUserProfile } from './admin.service';
import { environment } from '../../environments/environment';
import { HostService } from './host.service';
import { UtilsService } from './utils.service';

@Injectable()
export class GuardService implements CanActivate {
  public userData?: IUserProfile;

  private userLogged = false;
  private subscribers: any[] = [];

  constructor(
    private adminService: AdminService,
    private hostService: HostService,
    private utilsService: UtilsService
  ) {}

  destroySubscribers() {
    this.subscribers.forEach(s => s.unsubscribe());
  }

  canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const authFlag = !!route.data['workWithoutAuth'];
    return new Promise(resolve => {
      if (this.userLogged && !authFlag) {
        resolve(true);
      } else {
        forkJoin([this.adminService.getProfile(), this.hostService.getHostInfo()]).subscribe(
          ([profile, hostData]) => {
            // Handle profile response
            this.userData = profile;
            this.userLogged = true;
            // Handle host response
            this.hostService.createdAppDate = this.utilsService.fullDate(new Date(hostData.created_on));
            this.hostService.appName = hostData.name || 'CaseActive';
            this.hostService.modules = hostData.modules || [];
            this.hostService.requireUserFields = hostData.require_userfields || [];
            this.hostService.caseSchema =
              hostData.default_schemas.cases &&
              (hostData.default_schemas.cases as any)[0] &&
              (hostData.default_schemas.cases as any)[0].schema
                ? JSON.parse((hostData.default_schemas.cases as any)[0].schema)
                : { required: null, properties: null, type: null };
            this.hostService.caseUiSchema =
              hostData.default_schemas.cases &&
              (hostData.default_schemas.cases as any)[0] &&
              (hostData.default_schemas.cases as any)[0].ui_schema
                ? JSON.parse((hostData.default_schemas.cases as any)[0].ui_schema)
                : { type: null, elements: null };
            this.hostService.userSchema =
              hostData.default_schemas.users &&
              (hostData.default_schemas.users as any)[0] &&
              (hostData.default_schemas.users as any)[0].schema
                ? JSON.parse((hostData.default_schemas.users as any)[0].schema)
                : { required: null, properties: null, type: null };
            this.hostService.userUiSchema =
              hostData.default_schemas.users &&
              (hostData.default_schemas.users as any)[0] &&
              (hostData.default_schemas.users as any)[0].ui_schema
                ? JSON.parse((hostData.default_schemas.users as any)[0].ui_schema)
                : { type: null, elements: null };
            this.hostService.noteSchema =
              hostData.default_schemas.notes &&
              (hostData.default_schemas.notes as any)[0] &&
              (hostData.default_schemas.notes as any)[0].schema
                ? JSON.parse((hostData.default_schemas.notes as any)[0].schema)
                : { required: null, properties: null, type: null };
            this.hostService.noteUiSchema =
              hostData.default_schemas.notes &&
              (hostData.default_schemas.notes as any)[0] &&
              (hostData.default_schemas.notes as any)[0].ui_schema
                ? JSON.parse((hostData.default_schemas.notes as any)[0].ui_schema)
                : { type: null, elements: null };
            const startDate = new Date(this.hostService.startDate);
            const createdAppDate = new Date(this.hostService.createdAppDate);

            if (createdAppDate > startDate) {
              this.hostService.startDate = this.utilsService.fullDate(createdAppDate);
            }

            this.hostService.hostSubject.next({
              startDate: this.hostService.startDate,
              endDate: this.hostService.endDate
            });

            resolve(true);
          },
          err => {
            if (err?.error?.code === 401) {
              if (err.error?.message === 'UserRelationGrantedFieldsException') {
                const startIndex = location.host.indexOf('ca-') + 3;
                const endIndex = location.host.indexOf('.');
                const path = location.host.slice(startIndex, endIndex);

                location.href = `${environment.ACCOUNT_CLIENT_URL}?reconfirmInvitation=${path}`;
              } else {
                location.href = environment.IS_LOCAL ? `http://localhost:4201` : `${environment.ACCOUNT_CLIENT_URL}`;
              }
            }

            resolve(false);
          }
        );

        this.destroySubscribers();
      }
    });
  }
}
