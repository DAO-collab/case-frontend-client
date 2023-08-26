import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { TimePipe } from '../../../pipes/time.pipe';
import { UserService } from '../../../services/user.service';
import { OptionsService } from '../../../services/options.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { FormsService } from '../../../services/forms.service';
import { UtilsService } from '../../../services/utils.service';
import { HostService } from '../../../services/host.service';
import { SrcRequest } from '../../../models/SrcRequest';
import { IntakeFormService } from '../../../services/intake-form.service';

@Component({
  selector: 'app-intakes-submit',
  templateUrl: './intakes-submit.component.html',
  styleUrls: ['./intakes-submit.component.css']
})
export class IntakesSubmitComponent implements OnInit {
  form?: any;
  loading = true;
  formUpdated = false;
  pages: any[] = [];
  components: any[] = [];
  mediaList = [];
  properties: any = [];
  savingError = '';
  saveModel: any = {};
  blockFields = false;
  documentLink?: any;
  media_ct = 0;
  metaData: any = {};
  displayCount?: any;
  activeDocPage = 0;
  fieldsList: any[] = [];
  privateCDN = environment.PRIVATE_CDN_URL + '/';
  userField: any = [];
  realVariable: any = [];

  private typesByField: any = {};
  private unsubscribe$: Subject<void> = new Subject();
  private destroy$ = new Subject<void>();

  constructor(
    public datePipe: DatePipe,
    public timePipe: TimePipe,
    public userService: UserService,
    public optionsService: OptionsService,
    private notificationsService: PopInNotificationConnectorService,
    private formsService: FormsService,
    private utilsService: UtilsService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private hostService: HostService,
    private titleService: Title,
    private cd: ChangeDetectorRef,
    private intakeFormService: IntakeFormService
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Intake Forms`);
    this.typesByField = this.utilsService.generateTypesByFields();
    this.fieldsList = this.generateFieldsList();

    this.optionsService
      .userFields()
      .pipe(takeUntil(this.destroy$))
      .subscribe(userFields => (this.userField = userFields));

    this.userService
      .getAuthStatus()
      .pipe(
        takeUntil(this.unsubscribe$),
        map(res => {
          this.realVariable = res.data;
          this.form = (res.data as any).intake_pages; // check if this request is correct
          this.loading = false;

          this.prepareShowingForm(this.form);
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public handleSubmission(event: any) {
    this.pages.map(page => {
      Object.keys(page.schema.properties).map(key => {
        if (page.schema.properties[key].fieldType === 'time' && event.data[key] === '') {
          delete event.data[key];
        } else if (page.schema.properties[key].fieldType === 'date' && event.data[key] === '') {
          delete event.data[key];
        }
      });
    });

    Object.assign(this.saveModel, event.data);
  }

  save() {
    let isSuccessSend = false;

    const result: any = {};
    this.pages.map(page => {
      Object.keys(page.schema.properties).map(key => {
        if (page.schema.properties[key].require === true) {
          result[key] = key;
        }
      });
    });

    Object.keys(result).map(a => {
      if (this.saveModel[a] === '' || this.saveModel[a].length === 0) {
        isSuccessSend = true;
      }
    });

    if (isSuccessSend) {
      const notification: Notification = this.notificationsService.addNotification({
        title: `Submit form`
      });

      this.notificationsService.failed(notification, 'Fields can not be empty!');
      return;
    }

    this.intakeFormService
      .putIntake({ host_intake_data: [this.saveModel] })
      .pipe(
        takeUntil(this.unsubscribe$),
        map(() => {
          const startIndex = location.href.indexOf('ca-');
          const endIndex = location.href.indexOf('.');
          const hostId = location.href.slice(startIndex, endIndex);

          window.location.href = environment.APP_CLIENT_URL.replace('*', hostId);
        })
      )
      .subscribe();
  }

  public switchDocumentPage = (pageNumber: any) => {
    const fieldList = this.prepareShowingPage(pageNumber);
    this.convertToComponents(fieldList);
  };

  public backToForms(): void {
    this.router.navigate(['/']);
  }

  public prepareShowingPage(pageNumber: any): any {
    const currentPage = this.pages[pageNumber] || {};
    const elements = currentPage.ui_schema?.elements || [];
    const properties = currentPage.schema?.properties || [];
    const requiredList = currentPage.schema?.required || [];
    return elements.map((item: any) => {
      let result = properties[item.scope.split('/')[2]];
      result.require = requiredList.indexOf(result.key) >= 0;
      return result;
    });
  }

  public getElement(fieldType: string): string {
    return this.fieldsList.filter(item => item.id === fieldType)[0].element;
  }

  // Generate fields list
  private generateFieldsList() {
    return [
      { id: 'text', text: 'Text', element: 'Text' },
      { id: 'dropdown', text: 'Multiple choice', element: 'Multiple choice' },
      { id: 'multidropdown', text: 'Checkboxes', element: 'Checkboxes' },
      { id: 'date', text: 'Date', element: 'Date' },
      { id: 'time', text: 'Time', element: 'Time' },
      { id: 'number', text: 'Number', element: 'Number' },
      { id: 'text-only', text: 'Read-only text', element: 'Read-only text' },
      { id: 'docs', text: 'Upload Pdf', element: 'Pdf' },
      { id: 'images', text: 'Upload Image', element: 'Image' },
      { id: 'blank', text: 'Blank new page', element: 'Blank new page' }
    ];
  }

  // Checking object keys
  public checkObjectKeys = (v: {[key: string]: string}) => Object.keys(v);

  // Checking object values
  public checkObjectValues = (v: {[key: string]: string}) => Object.values(v);

  private convertToComponents(fieldList: any): void {
    this.components = [];
    fieldList.map((field: any) => {
      const item = { ...field };
      const componentItem: any = {};
      item.description = JSON.parse(item.description || '');
      componentItem['key'] = item.key;
      componentItem['label'] = item.title;
      componentItem['defaultValue'] = item.description;
      switch (item.fieldType) {
        case 'text':
          componentItem['type'] = 'textfield';
          break;
        case 'dropdown':
          componentItem['type'] = 'select';
          componentItem['valueProperty'] = 'value';
          componentItem['dataType'] = 'string';
          componentItem['data'] = {
            values: item.enum.map((option: any) => ({
              value: option,
              label: option
            }))
          };
          break;
        case 'multidropdown':
          componentItem['type'] = 'select';
          componentItem['valueProperty'] = 'value';
          componentItem['dataType'] = 'string';
          componentItem['multiple'] = true;
          componentItem['data'] = {
            values: item.enum.map((option: any) => ({
              value: option,
              label: option
            }))
          };
          break;
        case 'date':
          componentItem['type'] = 'datetime';
          componentItem['enableTime'] = false;

          if (item.description) {
            componentItem['defaultValue'] = this.datePipe.transform(String(item.description), 'YYYY-MM-dd');
          } else {
            const d = new Date();
            componentItem['defaultValue'] = this.datePipe.transform(String(d), 'YYYY-MM-dd');
          }

          break;
        case 'time':
          componentItem['type'] = 'textfield';
          componentItem['time'] = 'time';

          if (item.description) {
            componentItem['defaultValue'] = this.timePipe.transform(String(item.description), true);
          } else {
            const d = new Date();
            const time = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
            componentItem['defaultValue'] = this.timePipe.transform(String(time), true);
          }

          break;
        case 'number':
          componentItem['type'] = 'number';
          break;
        case 'text-only':
          componentItem['type'] = 'content';
          componentItem['label'] = '';
          componentItem['html'] = '<p class="multiline-text">' + item.description + '</p>';
          break;
        case 'docs':
          componentItem['type'] = 'content';
          componentItem['html'] = '';
          this.loadMediaSrcInfo(this.mediaList, item).map((imagePath: string) => {
            componentItem['html'] += "<div><img src='" + imagePath + "' alt='Form Docs Image'/></div>";
          });
          break;
        case 'images':
          componentItem['type'] = 'content';
          componentItem['html'] =
            "<img src='" + this.loadMediaSrcInfo(this.mediaList, item) + "' alt='Image not uploaded successfully'/>";
          break;
        default:
          componentItem['type'] = 'textfield';
          break;
      }
      this.components.push(componentItem);
    });
  }

  private prepareShowingForm(form: any) {
    this.pages = form || [];
    this.saveModel = this.loadDefaultAnswer(this.pages);
    this.blockFields = false;
    this.mediaList = form?.media || {};
    this.media_ct = form?.media_ct ?? 0;
    this.displayCount = this.pages.length;
    this.switchDocumentPage(this.activeDocPage);

    this.cd.detectChanges();
  }

  private loadDefaultAnswer(pages: any): any {
    const result: any = {};
    pages.map((page: any) => {
      Object.keys(page.schema.properties).map(key => {
        let description = page.schema.properties[key].description;
        description = JSON.parse(description);
        result[key] = description;
        if (page.schema.properties[key].fieldType === 'date') {
          if (description) {
            result[key] = this.datePipe.transform(String(description), 'YYYY-MM-dd');
          } else {
            const d = new Date();
            result[key] = this.datePipe.transform(String(d), 'YYYY-MM-dd');
          }
        } else if (page.schema.properties[key].fieldType === 'time') {
          if (description) {
            result[key] = this.timePipe.transform(String(description), true);
          } else {
            const d = new Date();
            const time = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
            result[key] = this.timePipe.transform(String(time), true);
          }
        } else if (
          page.schema.properties[key].fieldType === 'text-only' &&
          JSON.parse(page.schema.properties[key].description) === ''
        ) {
          delete result[key];
        }
      });
    });
    return result;
  }

  private loadMediaSrcInfo(media: any, item: any) {
    const mediaInfo = media[item.fieldType]?.items[item.description] || null;
    if (mediaInfo && mediaInfo.execution_status === 'SUCCEEDED') {
      const displaySizes = mediaInfo.display_sizes || [];
      const ext = mediaInfo.display_formats && mediaInfo.display_formats[0];
      const url_key = mediaInfo.alias_display_start
        ? mediaInfo.alias_display_start
        : mediaInfo.display_start
        ? mediaInfo.display_start
        : '';

      if (item.fieldType === 'docs') {
        let result = [];
        for (let i = 0; i < mediaInfo.display_count; i++) {
          result.push(
            this.getImageSrc({
              ext,
              url_key,
              height: '0',
              width: Math.max.apply(null, displaySizes),
              page: i + 1
            })
          );
        }
        return result;
      } else {
        const i = 0;
        return this.getImageSrc({
          ext,
          url_key,
          height: '0',
          width: Math.max.apply(null, displaySizes),
          page: i + 1
        });
      }
    } else {
      return '';
    }
  }

  private getImageSrc(request: SrcRequest): any {
    let mediaLink = `${this.privateCDN}${request.url_key
      .replace('${display_size}', request.width as any)
      .replace('${display_format}', request.ext)}`;
    if (~mediaLink.indexOf('${display_count}')) {
      mediaLink = mediaLink.replace('${display_count}', `${request.page}`);
    }
    return mediaLink;
  }

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }
}
