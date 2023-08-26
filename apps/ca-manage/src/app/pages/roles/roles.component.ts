import { Component, OnInit } from '@angular/core';
import { RolesService } from './services/roles.service';
import { LocalTranslationService } from '../../services/local-translation.service';
import { Router } from '@angular/router';
import { FilterPipe } from '../../common/pipes/filter.pipe';
import { Title } from '@angular/platform-browser';
import { HostService } from '../../services/host.service';
import { catchError, takeUntil } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { UnsubscriptionHandler } from '../../shared/classes/unsubscription-handler';
import { RoleType, RoleSearchAttribute } from './models/role.model';
import { UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css'],
  providers: [FilterPipe]
})
export class RolesComponent extends UnsubscriptionHandler implements OnInit {
  loading = true;
  roles: any = [];
  message = '';
  searchKey = RoleSearchAttribute.Name;
  searchVal = new UntypedFormControl('');
  filterVal?: RoleType;
  showSearchFilter = false;
  // RoleSearchAttribute = RoleSearchAttribute;
  startKey = '';

  constructor(
    private rolesService: RolesService,
    private errorD: LocalTranslationService,
    private router: Router,
    private titleService: Title,
    private hostService: HostService
  ) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Roles`);
    this.disactivatePreviousMessages();
    this.loading = true;
    this.filterVal = this.rolesService.subMenuItem;
    this.loadAllRoles();

    this.rolesService.rolesFilterSub.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      this.filterVal = res;
      this.loading = true;
      this.disactivatePreviousMessages();
      this.searchRolesRequest();
    });

    this.searchVal.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(searchValue => {
      if (searchValue !== '') {
        this.searchRolesRequest();
      } else {
        this.loadAllRoles();
      }
    });
  }

  closeSearchDropdownOutside(e: any) {
    const dropdown = e.target['closest']('.search-sub-filters');
    const selectionMain = e.target['closest']('.searchKey');
    const dropdownOnpage = document.querySelector('.search-sub-filters');

    if (!dropdown && !selectionMain && dropdownOnpage) {
      this.showSearchFilter = false;
    }
  }

  searchRolesRequest() {
    if (this.searchVal.value !== '') {
      this.rolesService
        .searchRoles(this.searchKey, this.searchVal.value)
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError(res => {
            this.loading = false;
            return throwError(res.error);
          })
        )
        .subscribe((res: any) => {
          this.roles = res.items;
          if (res.startKey) {
            this.startKey = encodeURIComponent(res.startKey);
          }
          this.loading = false;
        });
    } else {
      this.loadAllRoles();
    }
  }

  load_more() {
    this.rolesService
      .getMoreRoles(this.startKey)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe((res: any) => {
        res.items.map((item: any) => {
          this.roles.push(item);
        });
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        } else {
          this.startKey = '';
        }
        this.loading = false;
      });
  }

  // setSearchKey(key: RoleSearchAttribute) {
  //   this.searchKey = key;
  //   this.showSearchFilter = false;
  //
  //   if (this.searchVal.value.trim() !== '') {
  //     this.searchRolesRequest();
  //   } else {
  //     this.loadAllRoles();
  //   }
  // }

  deleteRole(ind: number) {
    const item = this.roles[ind];

    this.disactivatePreviousMessages();
    this.rolesService
      .deleteRole(item.role_id)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.message = res.error && res.error.error && res.error.error.message ? res.error.error.message : '';
          this.showError();
          return throwError(res.error);
        })
      )
      .subscribe(() => this.roles.splice(ind, 1));
  }

  disactivatePreviousMessages() {
    this.message = '';
    this.router.navigate(['roles']);
  }

  private loadAllRoles() {
    this.disactivatePreviousMessages();
    this.startKey = '';
    this.rolesService
      .getRoles()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe((data: any) => {
        this.roles = data.items;
        if (data.items.startKey) {
          this.startKey = encodeURIComponent(data.items.startKey);
        }
        this.loading = false;
      });
  }

  private showError() {
    if (this.errorD.errorsDictionary) {
      this.message = this.errorD.errorsDictionary[this.message] || this.message;
    } else {
      this.errorD
        .loadErrors()
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(() => (this.message = this.errorD?.errorsDictionary?.[this.message] || this.message));
    }
  }
}
