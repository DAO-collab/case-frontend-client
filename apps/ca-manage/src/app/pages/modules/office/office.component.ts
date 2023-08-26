import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import {
  PopInNotificationConnectorService,
  Notification
} from './../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { LocationsService } from '../../../services/locations.service';
import { StylesService } from '../../../services/styles.service';
import { HostService } from '../../../services/host.service';
import { RolesService } from '../../roles/services/roles.service';
import { ILocation } from './models/location.model';
import { IRole } from '../../roles/models/role.model';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { Address } from 'ngx-google-places-autocomplete/objects/address';

@Component({
  selector: 'app-office',
  templateUrl: './office.component.html',
  styleUrls: ['./office.component.css']
})
export class OfficeComponent extends UnsubscriptionHandler implements OnInit {
  public loading = true;
  public saving = false;
  public locations: ILocation[] = [];
  public activeLocationPopUp = false;
  public formTouched = false;
  public roles: IRole[] = [];
  public locationForm = this.fb.group({
    tag_id: ['', Validators.required],
    permissions: [],
    address: ['', Validators.required],
    main_office: false
  });
  public startKey = '';

  private rolesById: any = {};

  constructor(
    private locationsService: LocationsService,
    private stylesService: StylesService,
    private notificationsService: PopInNotificationConnectorService,
    private rolesService: RolesService,
    private titleService: Title,
    private hostService: HostService,
    private fb: UntypedFormBuilder
  ) {
    super();
  }

  ngOnInit() {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.activeLocationPopUp) {
        this.refreshModal();
      }
    });

    this.titleService.setTitle(`${this.hostService.appName} | Library`);
    this.rolesService
      .getRoles()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(({ items }) => {
        this.roles = items;
        this.roles.forEach((v: any) => (this.rolesById[v.role_id] = v.name));
      });
    this.locationsService.activeLocationPopUp.pipe(takeUntil(this.unsubscribe$)).subscribe(r => {
      this.activeLocationPopUp = r;
      this.refreshModal(true);
    });

    this.getOfficesList();
  }

  public setPermissions(permissions: string[]) {
    this.locationForm.patchValue({ permissions });
  }

  public handleAddressChange(address: Address) {
    this.locationForm.patchValue({ address: address.formatted_address });
  }

  public saveLocation() {
    this.formTouched = true;

    if (this.locationForm.invalid) {
      return;
    }

    this.saving = true;

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Adding location'
    });

    this.locationsService
      .addLocation(this.locationForm.value)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, ' Location added');
        this.getOfficesList();
        this.refreshModal(false);
      });
  }

  public removeLocation(assetId: string) {
    const notification: Notification = this.notificationsService.addNotification({
      title: 'Removing location '
    });

    this.locationsService
      .deleteLocation(assetId)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, ' Location removed');
        this.getOfficesList();
      });
  }

  public refreshModal(modalState?: boolean): void {
    this.formTouched = false;
    this.saving = false;
    this.loading = false;
    this.locationForm.reset({ permissions: [] });
    this.locationForm.reset({ main_office: false });
    modalState ? (this.activeLocationPopUp = true) : (this.activeLocationPopUp = false);
    modalState ? this.stylesService.popUpActivated() : this.stylesService.popUpDisactivated();
  }

  private getOfficesList() {
    this.locationsService
      .getLocations()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe((res: any) => {
        this.locations = res.items || [];
        console.log('locations =>', this.locations);
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        }
        this.refreshModal(false);
        this.loading = false;
      });
  }

  public load_more() {
    this.locationsService
      .getMoreLocations(this.startKey)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe((res: any) => {
        res.items.map((item: any) => {
          this.locations.push(item);
        });
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        } else {
          this.startKey = '';
        }
        this.refreshModal(false);
        this.loading = false;
      });
  }
}
