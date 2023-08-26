import { ApplicationRef, Component, Input, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { PinchZoomComponent } from 'ngx-pinch-zoom';

import { PopInNotificationConnectorService } from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { StylesService } from '../../../services/styles.service';
import { UserService } from '../../../services/user.service';
import { CasesService } from '../../../services/cases.service';
import { FeedMediaService } from '../../../services/feed-media.service';
import { FeedsService } from '../../../services/feeds.service';
import { FormsService } from '../../../services/forms.service';
import { SignsService } from '../../../services/signs.service';
import { UtilsService } from '../../../services/utils.service';
import { HostService } from '../../../services/host.service';
import { OptionsService } from '../../../services/options.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { FormBuilder } from '../../../shared/form-builder';
import { TimePipe } from '../../../pipes/time.pipe';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { APP_FAVICON } from '../../../utils/constants.utils';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-form-view',
  templateUrl: './form-view.component.html',
  styleUrls: ['./form-view.component.css'],
  providers: [TimePipe, DatePipe]
})
export class FormViewComponent extends FormBuilder implements OnInit, OnDestroy {
  @ViewChild('myPinch') myPinch?: PinchZoomComponent;
  @Input() currentCaseId?: string;
  @Input() selectedForm?: any;
  @Input() teamData?: any;

  validationErrors: any = [];
  is_preview = false;
  userField: any = [];
  realVariable: any = [];

  constructor(
    timePipe: TimePipe,
    datePipe: DatePipe,
    notificationsService: PopInNotificationConnectorService,
    translationService: LocalTranslationService,
    public override stylesService: StylesService,
    public override changeDetector: ApplicationRef,
    public override route: ActivatedRoute,
    public override router: Router,
    public override sanitizer: DomSanitizer,
    public override userService: UserService,
    public override casesService: CasesService,
    public override feedsMediaService: FeedMediaService,
    public override feedsService: FeedsService,
    public override contentMediaService: FeedMediaService,
    public override formsService: FormsService,
    public override signsService: SignsService,
    public override utilsService: UtilsService,
    public override optionsService: OptionsService,
    private hostService: HostService,
    private titleService: Title
  ) {
    super(
      timePipe,
      datePipe,
      notificationsService,
      translationService,
      stylesService,
      formsService,
      signsService,
      contentMediaService,
      changeDetector,
      sanitizer,
      route,
      router,
      casesService,
      feedsService,
      feedsMediaService,
      userService,
      utilsService,
      optionsService
    );
  }

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Forms`);
    this.builderService = this.formsService;
    this.afterUpdateNavigation = '/forms/';
    this.userId = this.userService.userData?.user_id;
    this.route.params.subscribe(params => {
      this.is_preview = params['preview'] === '1' ? false : true;
    });

    this.optionsService.userFields().subscribe(userFields => {
      this.userField = userFields;
    });

    this.userService.getAuthStatus().subscribe(res => {
      this.realVariable = res.data;
    });
    this.initializationComponents();
    this.previewForm();
  }

  ngOnDestroy() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  backToForms(): void {
    const tab: string = this.formsService.currentTab$.value;
    this.router.navigate(['/forms'], { queryParams: { tab } });
  }

  previewForm(): void {
    this.refreshPreview();
    setTimeout(() => {
      this.calcFieldPosition();
    });
  }

  getElement(fieldType: any): string {
    return this.fieldsList?.filter(item => item.id === fieldType)[0].element;
  }

  onFieldTypeSelectChange({ id }: { id: string; text: string }) {
    this.newFieldType = id;
  }

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  public downloadPDF(): void {
    const documentDefinition: any = this.getDocumentDefinition();
    pdfMake.createPdf(documentDefinition).download();
  }

  public getDocumentDefinition() {
    //TODO: help - http://pdfmake.org/playground.htmlconst startIndex = location.href.indexOf('ca-');
    const startIndex = location.href.indexOf('ca-');
    const endIndex = location.href.indexOf('.');
    const hostId = location.href.slice(startIndex, endIndex);
    const formName = this.formModel?.name;
    const appName = this.hostService.appName;
    const content = this.components.reduce((acc: any, cur: any) => {
      let component = [];
      if (cur.type === 'select') {
        component = [
          {
            text: `${cur.label}`,
            style: 'name'
          },
          {
            table: {
              body: cur.data.values.map((value: any) => {
                const valueList = Array.isArray(this.submission[cur.key])
                  ? this.submission[cur.key]
                  : [this.submission[cur.key]];
                if (valueList.includes(value.value)) {
                  return [
                    {
                      image:
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAAjVBMVEUAAACAgICqqqqZmZmqqqqem5udnZ2bm5udnZ2em5uenp6cnJydnZ2dnZ2enJydm5udm5ucnJydm5udnZ2dnJycm5uenJydnJydnZ2enZ2cnJydnJydnZ2cm5udnJydnJydnZ2cnJydnJydm5udnJydnJydnZ2enJyenZ2dnJydnJydnJydnZ2dnJz////emKHGAAAALXRSTlMAAgMFBk9RUlNUVFVWj5CRkpOurq+wsLGx5OXl5ebm5+fo6PLy9PT09Pf4+f5GjbvNAAAAAWJLR0QuVNMQhwAAAI9JREFUGBllwY0WgTAABtAvW5FE5F+FbJXxvf/rUc7ZyXYvBnJxKF6m2CcS1rx+cPC4TfEzWXe0dBagt2450qzwNe/4R0eAuNNRSySKDhXjSM8OJT1nGHoMDD1PlPScsX3TtUGi6FAxREXHVQIzzT9tiK+s4YhO0QuWmlabBviJKsWBuoSwRJyfjDnlsUDvA4H3NNXvdFm3AAAAAElFTkSuQmCC',
                      width: 20
                    },
                    {
                      text: value.value,
                      margin: [0, 4, 0, 0]
                    }
                  ];
                } else {
                  return [
                    {
                      image:
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHXSURBVHgBrVRZTvJgFL0thQ7wQP7fOL5AwvAKO3AH6grUFRhXQN0BOzDsgCW4BF4ZEvqk4pSGFGyhgucQMYoTWE/ydbhfvpP73XvOVeQTdLvd9GQyOcTanU6nJUVRMozj28F3A6uey+Vqn51VFgPNZnM/FoudJ3Q9nUymRDcM0TRttjcajWSMNRwOJfAfHYTsReJ3hJ1Opwqyk3//12ZE3+EpDOWmdy1hGJ7l83n7A2G73bYTiURlfWNTFFWVZYCSzEiRdRWkp6+ErVbrKB6Pn29ubS9N9pa0d3XJchwUi8W68nLV7tb2Tib2UqtV4fu+3PauXc/zshqzM0zz12SEgXrrupGGCg5VYM80LYmKZColkNOuCtYMmiFRQVVQs+xAKf4HhNQqDbBaS5cAr+xAnBIVdBG4GmxKI0Dbo4KWxJUdFY+LwcCTqKC/OTSYYW0UBG6ULFmyx+HA4aBQs9msi9jx/f2dTGGjVTH3MxKz+T/rMpjrmB5VbqxCOifD2dcx9m58YeJUYEGbE0f7wYr07wNuFY7H1UKhcDqPfxiw9DZeFctKZkzLEop+7iTWirUeeJ4Ege8iw2NOmLfnla8yIDF9Tmvit8QYNUuZURn9fr9WLpfdxXPPRJ3s5o9bj7MAAAAASUVORK5CYII=',
                      width: 20
                    },
                    {
                      text: value.value,
                      margin: [0, 4, 0, 0]
                    }
                  ];
                }
              })
            },
            layout: 'noBorders',
            style: 'value'
          },
          '\n'
        ];
      } else {
        component = [
          {
            text: `${cur.label}`,
            style: 'name'
          },
          {
            text: `${this.submission[cur.key]}`,
            style: 'value'
          },
          '\n'
        ];
      }
      return [...acc, ...component];
    }, []);
    return {
      header: function (currentPage: any, pageCount: any, pageSize: any) {
        return {
          columns: [
            {
              text: formName,
              alignment: 'left',
              style: 'header'
            },
            {
              style: 'subHeader',
              table: {
                body: [
                  [
                    {
                      // image: 'favIcon',
                      text: 'favIcon',
                      width: 18,
                      height: 15,
                      alignment: 'center'
                    }
                  ],
                  [
                    {
                      text: appName,
                      alignment: 'center'
                    }
                  ]
                ]
              },
              width: 80,
              alignment: 'right',
              layout: 'noBorders'
            }
          ]
        };
      },
      content: [[...content]],
      footer: function (currentPage: any, pageCount: any) {
        return {
          columns: [
            {
              text: 'Created with caseactive.com',
              alignment: 'left',
              style: 'footer'
            },
            {
              text: `Page ${currentPage.toString()}/${pageCount}`,
              alignment: 'right',
              style: 'footer'
            }
          ]
        };
      },
      pageMargins: [40, 90, 40, 40],
      // images: {
      //   favIcon: APP_FAVICON(hostId),
      // },
      styles: {
        header: {
          margin: [40, 40, 0, 0],
          fontSize: 16,
          color: '#4B5153'
        },
        subHeader: {
          margin: [0, 30, 0, 0],
          fontSize: 6,
          color: '#9D9C9C',
          characterSpacing: 1
        },
        footer: {
          margin: [40, 0, 40, 40],
          fontSize: 8,
          heights: 50
        },
        name: {
          fontSize: 12,
          bold: true,
          color: '#4B5153',
          margin: [0, 0, 0, 18]
        },
        value: {
          fontSize: 12,
          color: '#4B5153',
          margin: [0, 0, 0, 13]
        }
      }
    };
  }
}
