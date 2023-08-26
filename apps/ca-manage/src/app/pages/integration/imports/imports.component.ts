import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { HostService } from '../../../services/host.service';
import { ImportsService } from '../services/imports.service';
import { StylesService } from '../../../services/styles.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { DriveService, IAwsUploadData, ModuleName } from '../../../services/drive.service';
import { AmazonService } from '../../../services/amazon.service';
import { OptionsService } from '../../../services/options.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { IImport, ImportsSearchAttribute, ImportStatus } from '../models/import.model';
import { IFileToUpload } from '../../modules/media/models/media.model';
import { saveAs as importedSaveAs } from 'file-saver';

@Component({
  selector: 'app-imports',
  templateUrl: './imports.component.html',
  styleUrls: ['./imports.component.css']
})
export class ImportsComponent extends UnsubscriptionHandler implements OnInit, OnDestroy {
  loading = true;
  imports: IImport[] = [];
  activeImportsPopUp = false;
  formTouched = false;
  validationErrors: any[] = [];
  importTypes: any = {};
  importTypesOptions: { id: string; text: string }[] = [];
  ImportStatus = ImportStatus;
  fileToUpload?: IFileToUpload | null;
  savingImport = false;
  addImportForm = this.fb.group({
    name: ['', Validators.required],
    type: ['', Validators.required],
    source: 'ca-manage'
  });
  showSearchFilter = false;
  ImportsSearchAttribute = ImportsSearchAttribute;
  searchKey = ImportsSearchAttribute.Name;
  searchVal = new UntypedFormControl('');
  startKey = '';

  constructor(
    private titleService: Title,
    private hostService: HostService,
    private importsService: ImportsService,
    private stylesService: StylesService,
    private fb: UntypedFormBuilder,
    private notificationsService: PopInNotificationConnectorService,
    private driveService: DriveService,
    private amazonService: AmazonService,
    private optionsService: OptionsService
  ) {
    super();
  }

  ngOnInit() {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        this.refreshModal();
      }
    });

    this.titleService.setTitle(`${this.hostService.appName} | Imports`);

    this.importsService.activeImportsPopUp.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
      this.activeImportsPopUp = value;
      this.refreshModal(true);
    });

    this.optionsService
      .importTypesList()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        this.importTypes = res;
        this.importTypesOptions = Object.keys(res)
          .map(key => ({ id: key, text: res[key] }))
          .filter(item => item.id !== 'delete_user')
          .sort((a, b) => a.text.localeCompare(b.text));

        const importsType = sessionStorage.getItem('importsType');

        // open imports modal with prefilled type
        if (importsType) {
          this.activeImportsPopUp = true;

          this.addImportForm.patchValue({
            type: importsType
          });
        }
      });

    this.fetchImports();

    this.searchVal.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(searchValue => {
      if (!searchValue) {
        this.searchImportsRequest();
      }
    });
  }

  override ngOnDestroy() {
    sessionStorage.removeItem('importsType');
  }

  fetchImports() {
    this.importsService
      .fetchImports()
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.loading = false))
      )
      .subscribe((res: any) => {
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        }
        this.imports = res.items;
      });
  }

  load_more() {
    this.importsService
      .fetchMoreImports(this.startKey)
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.loading = false))
      )
      .subscribe((res: any) => {
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        } else {
          this.startKey = '';
        }
        res.items.map((item: any) => {
          this.imports.push(item);
        });
      });
  }

  viewDetail(importTitle: any) {
    this.importsService.updateImportTitle(importTitle);
  }

  // download csv file uploaded by user
  downloadImport(selectedImport: IImport) {
    const csvArray: any[] = [];
    let importsItems;

    // get import from backend
    this.importsService
      .getImport((selectedImport.import_id as any))
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(({ items }) => {
        let takeHeaders = true;

        importsItems = items;

        // make a two-dimensional array
        importsItems.forEach(item => {
          // prevent default filtering of object keys and properties
          const orderedKeysObject = Object.keys(item.data)
            .sort()
            .reduce((obj: any, key) => {
              obj[key] = item.data[key];
              return obj;
            }, {});
          const objectPropertyArray = [];

          // make array for csv file from object keys. Needed only once
          if (takeHeaders) {
            const objectKeysArray = Object.keys(orderedKeysObject);

            csvArray.push(objectKeysArray);
            takeHeaders = false;
          }

          // make array for csv file from object properties
          // tslint:disable-next-line:forin
          for (const key in orderedKeysObject) {
            objectPropertyArray.push(item.data[key]);
          }

          csvArray.push(objectPropertyArray);
        });

        // prepare file for download
        const csvContent = 'data:text/csv;charset=utf-8,' + csvArray.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        const importName = selectedImport.name + '.import.csv';

        link.setAttribute('href', encodedUri);
        link.setAttribute('download', importName);

        document.body.appendChild(link);

        // download csv file
        link.click();

        document.body.removeChild(link);
      });
  }

  refreshModal(modalState?: boolean) {
    this.activeImportsPopUp = !!modalState;
    modalState ? this.stylesService.popUpActivated() : this.stylesService.popUpDisactivated();
    this.clearAddImportModal();
  }

  clearAddImportModal() {
    this.addImportForm.reset({ source: 'ca-manage' });
    this.formTouched = false;
    this.savingImport = false;
    this.fileToUpload = null;
  }

  closeModal() {
    this.activeImportsPopUp = false;
    this.stylesService.popUpDisactivated();
    this.clearAddImportModal();
    this.fetchImports();
  }

  saveImport() {
    this.formTouched = true;

    if (this.addImportForm.invalid || !this.fileToUpload) {
      return;
    }

    this.savingImport = true;
    const notification: Notification = this.notificationsService.addNotification({
      title: 'Import adding'
    });

    this.importsService
      .saveImport(this.addImportForm.value)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(({ import_id }) => this.handleFilesUploading(notification, import_id));
  }

  handleFileChange(target: HTMLInputElement) {
    if (!target.files) return;

    const file: File = target.files[0];
    this.fileToUpload = {
      fileData: file,
      type: file.type.split('/')[0],
      extension: 'csv',
      fileGroup: 'docs'
    };
  }

  downloadTypeSample(type: string) {
    let header!: string[];

    switch (type) {
      case 'post_user':
        header = ['username,given_name,family_name,locale,zoneinfo,host_tag_id'];
        break;
      case 'put_user':
        header = [
          'user_id,given_name,family_name,locale,zoneinfo,birthdate,gender,address1,address2,locality,region,postal_code,country,company,title,host_user_status,host_user_type,host_notifications,host_tag_id,'
        ];
        break;
      case 'post_case':
        header = ['tag_id,case_status,date_opened,about'];
        break;
      case 'put_case':
        header = ['case_id,case_status,date_opened,about'];
        break;
      case 'post_case_permission':
        header = ['case_id,user_id,case_role_order,case_role_id,case_notify'];
        break;
      case 'put_case_permission':
        header = ['case_id,user_id,case_role_id,case_notify'];
        break;
      case 'post_case_post':
        header = ['case_id,user_id,message'];
        break;
      case 'delete_case_permission':
        header = ['user_id,case_id'];
        break;
      case 'delete_user':
        header = ['user_id'];
        break;
    }

    const csvArray = header.join('\r\n');
    const blob = new Blob([csvArray], { type: 'text/csv' });

    importedSaveAs(blob, `${type}_sample.csv`);
  }

  searchImportsRequest() {
    if (this.searchVal.value) {
      this.importsService
        .searchImports(this.searchKey, this.searchVal.value)
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError(res => {
            this.loading = false;
            return throwError(res.error);
          })
        )
        .subscribe(res => {
          this.imports = res.items;
          this.loading = false;
        });
    } else {
      this.fetchImports();
    }
  }

  setSearchKey(key: ImportsSearchAttribute) {
    this.searchKey = key;
    this.showSearchFilter = false;

    this.searchVal.value.trim() !== '' ? this.searchImportsRequest() : this.fetchImports();
  }

  closeSearchDropdownOutside(e: any) {
    const dropdown = e.target['closest']('.search-sub-filters');
    const selectionMain = e.target['closest']('.searchKey');
    const dropdownOnpage = document.querySelector('.search-sub-filters');

    if (!dropdown && !selectionMain && dropdownOnpage) {
      this.showSearchFilter = false;
    }
  }

  private handleFilesUploading(notification: Notification, importId: string) {
    notification.title = 'File uploading';

    this.driveService
      .getUploadingRequestDataPrivate(
        this.fileToUpload?.fileGroup!,
        this.fileToUpload?.extension!,
        ModuleName.Imports,
        this.addImportForm.controls['name'].value,
        importId
      )
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(fileRes => {
        this.amazonService
          .filetoAWSUpload(fileRes, this.fileToUpload?.fileData!)
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe(res => {
            if (res.type === 4) {
              notification.title = 'File uploaded';
              this.onUploadSuccess(notification, importId, fileRes);
            }
          });
      });
  }

  private onUploadSuccess(notification: Notification, importId: string, filesRes: IAwsUploadData) {
    this.importsService
      .attachMediaToImport(filesRes.fields.key, importId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.closeModal();
        this.notificationsService.ok(notification, 'Import added');
      });
  }
}
