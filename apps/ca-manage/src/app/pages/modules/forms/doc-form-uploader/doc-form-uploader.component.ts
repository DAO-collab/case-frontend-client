import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { catchError, takeUntil } from 'rxjs/operators';
import { Subject, Subscription, throwError } from 'rxjs';

import { FormsService } from '../../../../services/forms.service';
import {
  IAddMediaRequest,
  IMedia,
  IMediaAttachment,
  IMediaObject,
  MediaStatus
} from '../../../../pages/modules/media/models/media.model';
import { UtilsService } from '../../../../services/utils.service';
import { ContentMediaService } from '../../../../services/content-media.service';
import { FeedMediaService } from '../../../../services/feed-media.service';
import { DriveService } from './../../../../services/drive.service';
import { ModuleName } from './../../../../services/drive.service';
import { AmazonService } from '../../../../services/amazon.service';
import { OptionsService } from '../../../../services/options.service';

import { IForm } from '../../../../services/forms.service';
import { PopInNotificationConnectorService } from '../../../../common/components/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-doc-form-uploader',
  templateUrl: './doc-form-uploader.component.html',
  styleUrls: ['./doc-form-uploader.component.css']
})
export class DocFormUploaderComponent implements OnInit {
  @Input() enabled?: boolean;
  @Input() form?: IForm;
  @Input() currentCaseId?: string;
  @Output() afterChange = new EventEmitter<boolean>();
  @Output() afterSave = new EventEmitter();

  public subscribers: any[] = [];
  public formMedia: IMediaAttachment[] = [];
  public uploadProgress: any;

  public formModel?: IForm;
  public docData: any = {};
  public supportedExtensions: any;
  public uploadingGoes = false;
  public blockFields = false;
  public documentKey = '';
  public attachedDoc: any = null;
  public caseId = '';
  public timeoutId: any = null;
  public isOpened = false;
  public loading = true;
  public formTouched = false;

  constructor(
    public driveService: DriveService,
    public amazonService: AmazonService,
    public contentMediaService: ContentMediaService,
    public feedMediaService: FeedMediaService,
    public utilsService: UtilsService,
    private notificationsService: PopInNotificationConnectorService,
    private formsService: FormsService,
    public changeDetector: ChangeDetectorRef,
    public optionsService: OptionsService
  ) {}

  ngOnInit(): void {
    this.enabled = true;
    this.formTouched = false;
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.isOpened) {
        this.submitModal();
      }
    });
    this.loadExtesions();
    this.formModel = this.form;
    this.loadExistingFormInfo();
  }

  loadExistingFormInfo() {
    const run = () => {
      this.blockFields = true;
      return this.formsService.getFormInfo(this.form?.asset_id!).subscribe((form: IForm) => {
        this.formModel = form;
        const doc: any = (() => {
          let returnDoc;
          const media = form.media;

          if (typeof media === 'object') {
            for (const groupName in media) {
              if (media.hasOwnProperty(groupName)) {
                const group: any = media[groupName as keyof IMedia];

                if (typeof group === 'object') {
                  for (const groupItemName in group) {
                    if (group.hasOwnProperty(groupItemName)) {
                      const item = group[groupItemName];

                      if (item && typeof item === 'object' && Object.values(item).length) {
                        returnDoc = Object.values(item)[0];
                      }
                    }
                  }
                }
              }
            }
          }

          return returnDoc;
        })();

        if (doc) {
          Object.assign(this.docData, doc);
          this.documentKey = doc.original;
          this.attachedDoc = {
            fileName: doc.tag_id,
            progress: 0,
            media: doc.original,
            src: ''
          };

          if (doc.display_start) {
            this.submitModal();
          } else if (doc.tag_id) {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => {
              run();
            }, 10000);
          }

          return;
        }
        this.loading = false;
        this.blockFields = false;
      });
    };

    this.subscribers.push(run());
  }

  public handleFileUpload(target: HTMLInputElement): void {
    if (!target.files) return;
    const fileDataI = target.files[0];
    const mimeFType = fileDataI.type;
    const fileTypeN = mimeFType.split('/')[0] + 's';
    const extension = fileDataI.name.split('.').pop();
    const keys = Object.keys(this.supportedExtensions['docs']);
    const tag_id = fileDataI.name.replace(/[^A-Za-z1-90-]/g, '-');

    let supported = false;

    keys.forEach(ext => {
      if (ext === extension) {
        supported = true;
      }
    });

    if (!supported) {
      return alert('unsupported mediatype or extension list not loaded');
    }

    this.docData.execution_status = 'RUNNING';
    this.uploadingGoes = true;
    this.driveService
      .getUploadingRequestDataPrivate('docs', extension!, ModuleName.Assets, tag_id, this.form?.asset_id!)
      .pipe(
        catchError(res => {
          this.uploadingGoes = false;
          this.changeDetector.detectChanges();
          return throwError(res.error);
        })
      )
      .subscribe(
        res => {
          this.attachedDoc = {
            fileName: fileDataI.name,
            progress: 0,
            media: res.fields.key,
            src: ''
          };
          const reader = new FileReader();

          if (fileTypeN === 'docs') {
            reader.onloadend = () => {
              this.attachedDoc.src = reader.result;
            };

            if (fileDataI) {
              reader.readAsDataURL(fileDataI);
            } else {
              this.attachedDoc.src = '';
            }
          }

          this.uploadProgress = '0%';

          this.amazonService.filetoAWSUpload(res, fileDataI).subscribe(resB => {
            if (resB.type === 1) {
              const percentDone = Math.round((100 * resB['loaded']) / resB['total']);

              this.uploadProgress = percentDone + '%';
            } else if (resB.type === 2) {
              this.uploadProgress = '0%';
              this.uploadingGoes = false;
              target.value = '';
              this.attachedDoc['key'] = res.fields.key;
              this.documentKey = res.fields.key;
              this.changeDetector.detectChanges();
              this.save();
            }
          });
        },
        () => {
          this.uploadingGoes = false;
          this.changeDetector.detectChanges();
          this.docData.execution_status = 'FAILED';
        }
      );
  }

  public save() {
    const updateFn = () => {
      const request: any = {
        tag_id: this.form?.tag_id,
        description: this.form?.description,
        pages: new Array(),
        ...this.form
      };
      if (request.pages.length === 0) 
        request.pages = null
      this.formsService.updateForm(request, this.form?.asset_id!).subscribe(
        () => {
          this.loadExistingFormInfo();
        },
        err => {
          if (this.formsService.checkRoutes()) {
            let notification: any;
            notification = this.notificationsService.addNotification({
              title: `Saving field`
            });
            this.notificationsService.failed(notification, err.message);
          }
        }
      );
    };
    if (!this.docData.display_start) {
      const mediaRequest: IAddMediaRequest = {
        media: [
          {
            media_key: this.documentKey
          }
        ]
      };

      this.contentMediaService
        .addPostMedia(mediaRequest, this.form?.asset_id!)
        .pipe(
          catchError(res => {
            return throwError(res.error);
          })
        )
        .subscribe(() => updateFn());
    } else {
      updateFn();
    }
  }
  loadExtesions() {
    this.optionsService.getExtesions().subscribe(data => {
      this.supportedExtensions = data;
    });
  }

  public closeModal(): void {
    this.afterChange.emit();
  }

  // Detect changes on event
  private submitModal(): void {
    this.afterChange.emit();
    this.afterSave.emit(this.formModel);
  }
}
