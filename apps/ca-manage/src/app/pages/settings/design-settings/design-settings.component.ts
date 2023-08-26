import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { catchError, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { of, Subject, throwError } from 'rxjs';

import {
  Notification,
  PopInNotificationConnectorService
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { environment } from '../../../../environments/environment';
import { DesignService, IDesign, SystemType } from '../../../services/design.service';
import { AmazonService } from '../../../services/amazon.service';
import { DriveService } from '../../../services/drive.service';
import { ConfirmationPopUpService } from '../../../services/confirmation-pop-up.service';
import { StylesService } from '../../../services/styles.service';
import { HostService } from '../../../services/host.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { AdminService } from '../../../services/admin.service';
import { RolesService } from '../../roles/services/roles.service';
import { ACCOUNT_CLIENT_URL_PLAIN } from '../../../shared/constants.utils';

@Component({
  selector: 'app-design-settings',
  templateUrl: './design-settings.component.html',
  styleUrls: ['./design-settings.component.css']
})
export class DesignSettingsComponent extends UnsubscriptionHandler implements OnInit, AfterViewInit {
  @ViewChild('userSignup') userSignupSection?: ElementRef<HTMLFormElement>;

  defaultTextColor = '22,176,197';
  defaultBackgroundColor = '18,150,168';
  uploadingGoes = false;
  designData: IDesign = {
    colors: {
      text: this.defaultTextColor,
      background: this.defaultBackgroundColor
    },
    available_colors: {
      logo: [this.defaultTextColor, this.defaultBackgroundColor],
      favicon: [this.defaultTextColor, this.defaultBackgroundColor]
    }
  };
  SystemType = SystemType;
  recommendedColors: any = [];
  analyticsData: any = {
    analytics_id: '',
    uuid: ''
  };
  faviconSrc: any;
  logoSrc?: string;
  popupDeletionGoes?: boolean;
  showCropModal?: boolean;
  formTouched?: boolean;
  newColor?: string;
  newBackground?: string;
  noFavicon?: any;
  noLogo?: any;
  uuid?: string;
  uploadProgress: any = {
    logo: {
      value: 0,
      stepName: ''
    },
    favicon: {
      value: 0,
      stepName: ''
    }
  };
  cropperContent?: File | null = null;
  imageChangedEvent: any = '';
  imageFile?: any;
  croperCoords: any[] = [];
  uploadingEvent?: any;
  uploadingType?: any;
  analyticsKey?: string;
  analyticsValidationErrors = [];
  analyticsFormTouched = false;
  analyticsId = new UntypedFormControl('');
  analyticsForm = new UntypedFormGroup({
    analyticsId: this.analyticsId
  });

  @ViewChild('canvasval', { static: true }) canvasval?: ElementRef;
  canvas?: any;
  ctx?: CanvasRenderingContext2D;
  canvasImg?: any;
  imageUpdateFlag = false;
  selectedDesignPattern?: any;
  companyName?: any;
  companyWebsite?: any;
  companyTerms?: any;
  companyInfoUpdate = new Subject<string>();
  environment = environment;
  interval?: any;
  usedSignupOptions: any = {
    allowSignup: [
      { text: 'Off', id: false },
      { text: 'On', id: true }
    ],
    createCase: [
      { text: 'Off', id: false },
      { text: 'On', id: true }
    ],
    userCaseRole: []
  };
  usedSignupInfoForm = this.fb.group({
    allowSignup: ['', Validators.required],
    createCase: ['', Validators.required],
    userCaseRole: ['', Validators.required]
  });
  userSignUpOptionsUpdated = new Subject<void>();
  hasUserSignUpResponseCame = false;
  hostId?: string;

  get signupUrl() {
    return ACCOUNT_CLIENT_URL_PLAIN(`/apps/${this.hostId}`);
  }

  constructor(
    private designService: DesignService,
    private amazonService: AmazonService,
    private translateService: TranslateService,
    private driveService: DriveService,
    private confirmationPopUpService: ConfirmationPopUpService,
    private notificationsService: PopInNotificationConnectorService,
    private stylesService: StylesService,
    private titleService: Title,
    private hostService: HostService,
    private adminService: AdminService,
    private cd: ChangeDetectorRef,
    private fb: UntypedFormBuilder,
    private rolesService: RolesService,
    private router: Router
  ) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Settings`);
    this.popupDeletionGoes = true;
    this.formTouched = false;
    const temp = localStorage.getItem('recommendedColors');
    if (temp) {
      const colors = JSON.parse(temp);
      this.recommendedColors = colors;
    } else {
      this.recommendedColors = this.designData.available_colors.logo.concat(this.designData.available_colors.favicon);
    }
    this.adminService.getProfile().subscribe(data => {
      if (data.company_system) {
        if (data.company_system.design) {
          this.designData.colors.text = data.company_system.design.colors.text;
          this.designData.colors.background = data.company_system.design.colors.background;
        }
      } else {
        this.interval = setInterval(() => {
          if (
            this.designData.colors.text ===
            window
              .getComputedStyle(document.querySelector('#root.logged-in #nav > ul > li.active > a')!)
              .color.slice(4, -1)
          ) {
            clearInterval(this.interval);
          }
          this.designData.colors.text = window
            .getComputedStyle(document.querySelector('#root.logged-in #nav > ul > li.active > a')!)
            .color.slice(4, -1);
          this.designData.colors.background = window
            .getComputedStyle(document.querySelector('.file-a .btn')!)
            .borderBottomColor.slice(4, -1);
          this.cd.detectChanges();
        }, 500);
      }
    });
    this.updateFavicon();
    this.updateLogo();
    Object.assign(this.analyticsData, this.analyticsData);
    this.analyticsId.setValue(this.analyticsData.analytics_id);

    this.designService.designChangeSubscription().subscribe(() => {
      Object.assign(this.designData, this.designData);
      Object.assign(this.analyticsData, this.analyticsData);
      this.analyticsId.setValue(this.analyticsData.analytics_id);
      this.updateLogo();
      this.updateFavicon();
      if (this.imageUpdateFlag) {
        this.imageUpdateFlag = false;
        if (this.selectedDesignPattern === 'logo') {
          this.getImage(this.logoSrc!);
        } else {
          this.getImage(this.faviconSrc);
        }
      }
    });

    this.designService.getCompanyInfo().subscribe(response => {
      this.companyName = response.name || '';
      this.companyWebsite = response.website || '';
      this.companyTerms = response.terms || '';
      this.usedSignupInfoForm.patchValue({
        allowSignup: response.host_signup?.allow_signup || false,
        createCase: response.host_signup?.case?.create_case || false,
        userCaseRole: response.host_signup?.case?.user_role_id || 'role::clients'
      });
      this.hasUserSignUpResponseCame = true;
      this.hostId = response.host_id;
    });

    this.companyInfoUpdate.pipe(debounceTime(1000), distinctUntilChanged()).subscribe(value => {
      const notification: Notification = this.notificationsService.addNotification({
        title: 'Updating Company Settings'
      });
      var company_data = {};
      if (this.companyTerms == '') {
        company_data = {
          name: this.companyName,
          website: this.companyWebsite
        };
      } else {
        company_data = {
          name: this.companyName,
          website: this.companyWebsite,
          terms: this.companyTerms
        };
      }
      this.designService
        .updateCompanyInfo(company_data)
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError(res => {
            this.notificationsService.failed(notification, res.error.error.reason);
            return throwError(res.error);
          })
        )
        .subscribe(() => {
          this.notificationsService.ok(notification, 'Company Settings Updated');
        });
    });

    this.userSignUpOptionsUpdated.pipe(debounceTime(1000), distinctUntilChanged()).subscribe(() => {
      const notification: Notification = this.notificationsService.addNotification({
        title: 'Updating Company Settings'
      });
      const formOptions = JSON.parse(JSON.stringify(this.usedSignupInfoForm.value));
      const data = {
        allow_signup: formOptions.allowSignup,
        case: {
          create_case: formOptions.createCase,
          user_role_id: formOptions.userCaseRole
        }
      };

      this.designService
        .updateSignupInfo(data)
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError(res => {
            this.notificationsService.failed(notification, res.error.error.reason);
            return throwError(res.error);
          })
        )
        .subscribe(() => {
          this.notificationsService.ok(notification, 'Company Settings Updated');
        });
    });

    this.designService.uuidChangeSubscription().subscribe(() => {
      Object.assign(this.analyticsData, this.analyticsData);
      this.analyticsId.setValue(this.analyticsData.analytics_id);
    });
    this.analyticsForm.valueChanges.pipe(debounceTime(1000)).subscribe(formData => this.updateAnalyticsKey(formData));

    this.rolesService
      .getRoles()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        res.items
          .filter(v => v.role_id !== 'role::bots')
          .forEach(role => {
            const roleInfo = { text: role.name, id: role.role_id };

            this.usedSignupOptions.userCaseRole.push(roleInfo);
          });
      });
  }

  ngAfterViewInit() {
    if (this.router.url.includes('#signup')) {
      this.userSignupSection?.nativeElement.scrollIntoView();
    }
  }

  getImage(url: string): void {
    this.canvasval!.nativeElement.innerHTML = '';
    this.canvas = this.canvasval?.nativeElement;
    this.ctx = this.canvas.getContext('2d');
    this.canvasImg = document.createElement('img');
    this.canvasImg.crossOrigin = 'anonymous';
    this.canvasImg.src = url;
    this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvasImg.onload = () =>
      this.ctx?.drawImage(
        this.canvasImg,
        0,
        0,
        this.canvasImg.width,
        this.canvasImg.height,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

    setTimeout(() => {
      this.getColorsFromImage();
    }, 5000);
  }

  getColorsFromImage() {
    const temp = localStorage.getItem('recommendedColors');
    if (temp) {
      const colors = JSON.parse(temp);
      this.recommendedColors = colors;
      return;
    }
    const pixelArray: any[] = [];
    for (let row = 0; row < this.canvas.width; row++) {
      for (let col = 0; col < this.canvas.height; col++) {
        const pixelD = this.ctx!.getImageData(row, col, 1, 1).data;
        const weightedR = Math.round(pixelD[0] / 20) * 20,
          weightedG = Math.round(pixelD[1] / 20) * 20,
          weightedB = Math.round(pixelD[2] / 20) * 20;
        pixelArray.push([weightedR, weightedG, weightedB]);
      }
    }
    this.designData.available_colors.logo = [];
    const tempDesignData = this.designData;
    const counts: any[] = [];
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < pixelArray.length; i++) {
      counts[pixelArray[i]] = 1 + (counts[pixelArray[i]] || 0);
    }
    for (const key in counts) {
      if (counts[key] > 250) {
        const v = key.split(',');
        const d = parseInt(v[0], 10) + ',' + parseInt(v[1], 10) + ',' + parseInt(v[2], 10);
        tempDesignData.available_colors.logo.push(d);
      }
      // ...
    }
    this.designData = tempDesignData;
    this.recommendedColors = this.designData.available_colors.logo.concat(this.designData.available_colors.favicon);
    localStorage.setItem('recommendedColors', JSON.stringify(this.recommendedColors));
  }

  getAveragePixel(): void {
    let r = 0,
      g = 0,
      b = 0,
      a = 0;
    for (let x = 0; x < this.canvas.width; x++) {
      // tslint:disable-next-line:variable-name
      let wR = 0,
        wG = 0,
        wB = 0,
        wA = 0;
      for (let y = 0; y < this.canvas.width; y++) {
        const pixelData = this.ctx!.getImageData(x, y, 1, 1).data;
        wR += pixelData[0];
        wG += pixelData[1];
        wB += pixelData[2];
        wA += pixelData[3];
      }
      r += wR / this.canvas.width;
      g += wG / this.canvas.width;
      b += wB / this.canvas.width;
      a += wA / this.canvas.width;
    }
    r = Math.round(r / this.canvas.height);
    g = Math.round(g / this.canvas.height);
    b = Math.round(b / this.canvas.height);
    a = Math.round(a / this.canvas.height);
    const pixelColor = r + ',' + g + ',' + b;
    const tempDesignData = this.designData;
    if (this.selectedDesignPattern === 'logo') {
      tempDesignData.available_colors.logo.push(pixelColor);
      // tempDesignData.colors.background = pixelColor;
    } else {
      tempDesignData.available_colors.favicon.push(pixelColor);
      // tempDesignData.colors.text = pixelColor;
    }
    this.designData = tempDesignData;
    this.recommendedColors = this.designData.available_colors.logo.concat(this.designData.available_colors.favicon);
  }

  imageCropped({ imagePosition: { x1, x2, y1, y2 } }: ImageCroppedEvent): void {
    // set left, top, width and height coords
    this.croperCoords = [x1, y1, x2 - x1, y2 - y1];
  }

  updateDesignData(fn?: any) {
    this.popupDeletionGoes = false;
    this.confirmationPopUpService.disactivatePopUp();
    if (typeof fn === 'function') {
      fn();
    }
  }

  getFavicon() {
    return this.designService.getDesignUrl('favicon', 'ico', '48');
  }

  updateFavicon() {
    const safeFaviconUrl = this.getFavicon();
    this.faviconSrc = (safeFaviconUrl as any)['changingThisBreaksApplicationSecurity'];
  }

  getLogo() {
    return [this.designService.getDesignUrl('logo', 'png'), this.designService.getDesignUrl('logo', 'png', '160')];
  }

  updateLogo() {
    const [safeLogoUrl, safeTopLogoUrl] = this.getLogo();
    this.logoSrc = (safeLogoUrl as any)['changingThisBreaksApplicationSecurity'];
  }

  deleteLogoOrFavicon = (systemType: SystemType) =>
    this.deleteSystemType(systemType, () => this.designService.designChange());

  deleteSystemType = (type: SystemType, fn?: any) => {
    this.popupDeletionGoes = true;

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Deleting ' + type
    });

    this.designService
      .deleteSystemType(type)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.popupDeletionGoes = false;
          this.notificationsService.failed(notification, res.message);
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, type + ' deleted');
        this.updateDesignData(fn);
      });
  };

  setUploadingProperties(event: any, type: any) {
    this.cropperContent = event.target.files.item(0);
    this.imageChangedEvent = event;
    this.uploadingType = type;
    this.showCropModal = true;
  }

  /*
   * handleFileUpload - upload attached to new feed file
   * - runs automatically when file choosen
   */
  public handleFileUpload(e: any, event: any, type: any) {
    e.preventDefault();

    const fileDataI: Blob = event.target.files[0];

    const ext = 'png';
    const mimeFType = fileDataI.type;
    const fileTypeN = mimeFType.split('/')[0];

    if (fileTypeN !== 'image') {
      return alert((this.translateService.get('You should choose image file.') as any)['value']);
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Uploading.'
    });
    this.selectedDesignPattern = type;
    if (type === 'logo') {
      this.noLogo = true;
    } else {
      // type === Favicon
      this.noFavicon = true;
    }

    this.uploadProgress[type].stepName = 'Uploading Request';
    localStorage.setItem('recommendedColors', '');
    this.driveService
      .getUploadingRequestData('images', ext, type, this.croperCoords)
      .pipe(catchError(res => throwError(res.error)))
      .subscribe(resP => {
        if (fileTypeN === 'image') {
          this.upploadToAmazon(resP, fileDataI, event.target, type, notification);
        }
      });
  }
  dataURLtoFile(dataurl: string, filename: string) {
    const arr = dataurl.split(','),
      mime = arr[0]?.match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  upploadToAmazon(resP: any, fileDataI: any, target: any, type: any, notification: Notification) {
    this.uploadProgress[type].stepName = 'Uploading';

    this.amazonService.filetoAWSUpload(resP, fileDataI).subscribe(
      resB => {
        if (resB.type === 1) {
          const percentDone = Math.round((100 * resB['loaded']) / resB['total']);

          this.uploadProgress[type].value = percentDone;
        } else if (resB.type === 2) {
          this.uploadProgress[type].value = 0;
          this.uploadingGoes = false;
          target.value = '';

          this.uploadProgress[type].stepName = 'Updating Settings';
          notification.title = 'Updating Settings';
          this.hideCropPopup();
          this.imageUpdateFlag = true;
          this.notificationsService.ok(notification, 'Image Uploaded');
          this.designService.designChange();
        }
      },
      err => {
        if (err.status !== 201) {
          this.notificationsService.failed(notification, 'Failed.');
        }
      }
    );
  }

  saveDesign() {
    const notification: Notification = this.notificationsService.addNotification({
      title: 'Updating design.'
    });
    this.designService
      .updateDesignData(this.designData)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, 'Design updated');
        this.designService.designChange();
        window.location.reload();
        this.updateDesignData();
      });
  }

  removeStyle(style: any, defaultColor: string) {
    this.designData.colors[style as keyof IDesign['colors']] = defaultColor;
    this.saveDesign();
  }

  setNewColor(colors: string[], newColor: any, propertyName: any) {
    const rgbColor = newColor
      .match(/[A-Za-z0-9]{2}/g)
      .map((v: any) => parseInt(v, 16))
      .join(',');
    colors[propertyName] = rgbColor;
  }

  hideCropPopup() {
    this.showCropModal = false;
    this.stylesService.popUpDisactivated();
    this.formTouched = false;
    this.imageChangedEvent.target.value = '';
  }

  updateAnalyticsKey(formData: any) {
    const analyticsId: string = formData.analyticsId;

    if (!analyticsId || this.analyticsData.analytics_id === analyticsId) {
      return;
    }

    this.analyticsFormTouched = true;

    if (this.analyticsValidationErrors.length) {
      return;
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Updating Settings.'
    });

    this.designService
      .updateAnalyticsKey(analyticsId)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, 'Analytics key updated!');
        this.analyticsData.analytics_id = analyticsId;
      });
  }

  deleteAnalyticsKey() {
    this.popupDeletionGoes = true;

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Deleting ' + SystemType.Analytics
    });

    this.designService
      .deleteAnalyticsKey()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.popupDeletionGoes = false;
          this.notificationsService.failed(notification, res.message);
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, SystemType.Analytics + ' deleted');
        this.updateDesignData(() => {
          this.analyticsData = {
            uuid: '',
            analytics_id: ''
          };
          this.analyticsId.reset();
        });
      });
  }

  imageLoaded(scope: any, type: any) {
    scope[type] = false;
  }

  copyText(): void {
    navigator.clipboard.writeText(this.signupUrl).then();
    const notification: Notification = this.notificationsService.addNotification({
      title: `Copied`
    });
    this.notificationsService.ok(notification, 'ok');
  }
}
