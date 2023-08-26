import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  DoCheck,
  ElementRef,
  HostListener
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { PinchZoomComponent } from 'ngx-pinch-zoom';

import { StylesService } from './../../../../services/styles.service';
import { DriveService } from './../../../../services/drive.service';
import { HostService } from '../../../../services/host.service';
import { LocalTranslationService } from '../../../../services/local-translation.service';
import { AmazonService } from '../../../../services/amazon.service';
import { OptionsService } from '../../../../services/options.service';
import { ContentMediaService } from '../../../../services/content-media.service';
import { FeedMediaService } from '../../../../services/feed-media.service';
import { DesignService } from '../../../../services/design.service';
import { UtilsService } from '../../../../services/utils.service';
import { TimePipe } from '../../../../common/pipes/time.pipe';
import { PopInNotificationConnectorService } from '../../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { DocIntakeBuilder } from '../../../../shared/classes/doc-intake-building';
import { IntakeFormsService } from '../../../../services/intake-forms.service';
import { FormsService } from '../../../../services/forms.service';

@Component({
  selector: 'app-create-doc-form',
  templateUrl: './create-doc-form.component.html',
  styleUrls: ['./create-doc-form.component.css'],
  providers: [TimePipe]
})
export class CreateDocFormComponent extends DocIntakeBuilder implements OnInit, OnDestroy, DoCheck {
  @ViewChild('myPinch') myPinch?: PinchZoomComponent;
  @ViewChild('pinchZoomWrapper', { static: false }) set content(content: ElementRef) {
    if (content) {
      this._pinchZoomWrapper = content;
    }
  }

  @ViewChild('backgroundImage', { static: false }) set backgroundContent(content: ElementRef) {
    if (content) {
      setTimeout(() => {
        this._backgroundImage = content;
        this.scale = this.intakeFormsService.scaleBuilder(this.pinchZoomWrapper!, this.backgroundImage?.nativeElement);
        this.bgImgLoaded = true;
      });
    }
  }
  public optionsSupport: any = {
    dropdown: true,
    multidropdown: true,
    checkboxes: true,
    options: true
  };
  public isPreview = false;
  public selectedItem = '';
  public keyword: string = '';
  public bgImgLoaded = false;
  public selectedElementPopupMenu: number = -1;

  public scale?: number;
  private isZoomed?: boolean;
  private _pinchZoomWrapper?: ElementRef;
  private _backgroundImage?: ElementRef;

  private get pinchZoomWrapper() {
    return this._pinchZoomWrapper;
  }

  private get backgroundImage() {
    return this._backgroundImage;
  }

  get currentTime() {
    const currentTime = new Date().toLocaleTimeString();
    return currentTime.split(' ')[0].split(':');
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.backgroundImage) {
      setTimeout(() => {
        this.scale = this.intakeFormsService.scaleBuilder(this.pinchZoomWrapper!, this.backgroundImage?.nativeElement);
      });
    }
  }

  constructor(
    public override notificationsService: PopInNotificationConnectorService,
    public override utilsService: UtilsService,
    public override timePipe: TimePipe,
    public errorD: LocalTranslationService,
    public override changeDetector: ChangeDetectorRef,
    public override stylesService: StylesService,
    public override driveService: DriveService,
    public override route: ActivatedRoute,
    public override router: Router,
    public override sanitizer: DomSanitizer,
    public datePipe: DatePipe,
    public formsService: FormsService,
    public override optionsService: OptionsService,
    public override intakeFormsService: IntakeFormsService,
    public contentMediaService: ContentMediaService,
    public feedMediaService: FeedMediaService,
    public override amazonService: AmazonService,
    public override formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private hostService: HostService,
    public override designService: DesignService
  ) {
    super(
      notificationsService,
      utilsService,
      timePipe,
      stylesService,
      intakeFormsService,
      contentMediaService,
      feedMediaService,
      amazonService,
      errorD,
      optionsService,
      driveService,
      changeDetector,
      sanitizer,
      route,
      router,
      datePipe,
      formBuilder,
      designService
    );
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Intake Forms`);
    this.loading = true;
    this.formTouched = false;
    this.addFieldFormTouched = false;

    this.loadOpenedInformation();
    this.loadExtesions();

    this.subscribers.push(
      this.autoSaveObserver.subscribe(r => {
        clearTimeout(this.saveTimeoutId);
        this.saveTimeoutId = setTimeout(() => {
          this.save(true);
        }, 1000);
      })
    );
    this.initializationComponents();
  }

  onBgImgLoad() {
    this.bgImgLoaded = true;
  }

  previewForm(): void {
    this.isPreview = !this.isPreview;
  }

  backToForms(): void {
    this.router.navigate(['/settings/intake-forms']);
  }

  toggleZoom(isZoomIn?: boolean) {
    if ((isZoomIn && !this.isZoomed) || (!isZoomIn && this.isZoomed)) {
      this.myPinch?.toggleZoom();
      this.formsService.zoomIn(this.pinchZoomWrapper!, this._backgroundImage?.nativeElement?.offsetHeight, isZoomIn);
      this.isZoomed = !this.isZoomed;
    }
  }

  ngDoCheck() {
    this.updateDocumentViewSizeDueToWindowWidth();
  }

  ngOnDestroy() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  selectEvent($event: any) {
    this.editingField.defaultValue = $event;
  }

  onChangeSearch($event: any) {
    this.editingField.defaultValue = $event;
  }

  shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  changeStyle($event: any, data: any) {
    this.selectedItem = $event.type == 'mouseover' ? data.key : '';
  }

  public changeToogle(event: any): void {

  }

  public showElementPopupMenu(index: number): void {
    
  }
}
