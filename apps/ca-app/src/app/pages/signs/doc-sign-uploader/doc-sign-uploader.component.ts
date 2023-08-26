import { Component, EventEmitter, Input, OnInit, Output, ApplicationRef } from '@angular/core';

import { FormModel } from '../../forms/models/FormModel';
import { UtilsService } from '../../../services/utils.service';
import { SignsService } from '../../../services/signs.service';
import { UserService } from '../../../services/user.service';
import { CasesService } from '../../../services/cases.service';
import { FeedMediaService } from '../../../services/feed-media.service';
import { IFileToUpload } from '../../feeds/models/feed.model';
import { IAllowedFileSizes } from '../../../services/feed-media.service';
import { FeedsService } from '../../../services/feeds.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-doc-sign-uploader',
  templateUrl: './doc-sign-uploader.component.html',
  styleUrls: ['./doc-sign-uploader.component.css']
})
export class DocSignUploaderComponent implements OnInit {
  @Input() enabled?: boolean;
  @Input() sign?: FormModel;
  @Input() currentCaseId?: string;
  @Output() afterChange = new EventEmitter<boolean>();
  @Output() afterSave = new EventEmitter();

  public signModel: FormModel = new FormModel();
  public docData: any = {};
  public supportedExtensions: any;
  public uploadingGoes = false;
  public blockFields = false;
  public documentKey = '';
  public attachedDoc: any = null;
  public caseId = '';
  public timeoutId: any = null;
  public allowedFileSizes?: IAllowedFileSizes;
  public isOpened = false;
  public loading = true;
  public formTouched = false;

  constructor(
    public utilsService: UtilsService,
    private notificationsService: PopInNotificationConnectorService,
    private signsService: SignsService,
    private userService: UserService,
    public casesService: CasesService,
    public contentMediaService: FeedMediaService,
    public feedsService: FeedsService,
    public changeDetector: ApplicationRef
  ) {}

  ngOnInit(): void {
    this.enabled = true;
    this.formTouched = false;
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.isOpened) {
        this.submitModal();
      }
    });
    this.caseId = this.casesService?.activeCase?.case_id || '';
    if (this.currentCaseId) {
      this.caseId = this.currentCaseId;
    }
    this.loadExtesions();
    this.casesService.getCaseId.subscribe(res => {
      this.caseId = res['case_id'];
      if (this.caseId) {
        this.loadExtesions();
      }
    });
    this.userService.getCasePermissionsData.subscribe(data => {
      if (data.role.file_size) {
        this.allowedFileSizes = data.role.file_size;
      }
    });
    this.signModel = this.sign as any;
    this.loadExistingFormInfo();
  }

  private loadExistingFormInfo() {
    if (this.sign?.sign_id) {
      this.signsService.getFormInfo(this.caseId, this.sign.sign_id).subscribe(formModel => {
        this.signModel.name = formModel.name;
        formModel.description !== undefined
          ? (this.signModel.description = formModel.description)
          : delete this.signModel.description;
        formModel.media_asset_id
          ? (this.signModel.media_asset_id = formModel.media_asset_id)
          : delete this.signModel.media_asset_id;
        formModel.notifications !== undefined
          ? (this.signModel.notifications = formModel.notifications)
          : delete this.signModel.notifications;
        formModel.permissions !== undefined
          ? (this.signModel.permissions = formModel.permissions)
          : delete this.signModel.permissions;
        formModel.participants_ids !== undefined
          ? (this.signModel.participants_ids = formModel.participants_ids)
          : delete this.signModel.participants_ids;
        formModel.field_participants !== undefined
          ? (this.signModel.field_participants = formModel.field_participants)
          : delete this.signModel.field_participants;
        this.signModel.duration.due_date = formModel.due_date;
        formModel.rrule ? (this.signModel.duration.rrule = formModel.rrule) : delete this.signModel.duration.rrule;
        this.signModel.type = formModel.type;
        this.signModel.published = formModel.published;
        this.signModel.pages_ct = formModel.pages_ct;
        this.signModel['media_ct'] = formModel.media_ct;

        const doc = () => {
          let returnDoc;
          const media = formModel.media;
          if (typeof media === 'object') {
            for (const groupName in media) {
              if (media.hasOwnProperty(groupName)) {
                const group: any = media[groupName];

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
        };
        const document: any = doc();

        if (document) {
          Object.assign(this.docData, document);
          this.documentKey = document.original;
          this.attachedDoc = {
            fileName: document.name || document.tag_id,
            progress: 0,
            media: document.original,
            src: ''
          };

          if (this.docData.display_start && this.docData.execution_status === 'SUCCEEDED') {
            this.submitModal();
          }
          if (!document.display_start && document.tag_id) {
            clearTimeout(this.timeoutId as any);

            if (!this.docData.display_start && this.docData.execution_status !== 'FAILED') {
              this.timeoutId = setTimeout(() => {
                this.loadExistingFormInfo();
              }, 10000);
            }
          }
        }
        this.loading = false;
        this.blockFields = !!formModel.answer_ct;
      });
    } else {
      this.loading = false;
    }
  }

  public handleFileUpload(target: HTMLInputElement): void {
    if (!target.files) return;
    const file: File = target.files[0];
    const fileSize = (Math.ceil(file.size / 100000) / 10).toFixed(1);
    const fileToUpload: IFileToUpload = {
      fileData: file,
      type: file.type.split('/')[0],
      extension: file.name.split('.').pop()!.toLowerCase(),
      fileGroup: ''
    };

    if (!this.checkFileExtension(fileToUpload)) {
      return alert('Unsupported file extension.');
    }

    if (this.allowedFileSizes && +fileSize > this.allowedFileSizes[fileToUpload.fileGroup as keyof IAllowedFileSizes]) {
      this.notificationsService.addNotification({
        title: 'Entity Too Large',
        text: `Your proposed upload exceeds the maximum allowed size`,
        status: 'error',
        width: '430px'
      });
      target.value = '';
      return;
    }

    this.docData.execution_status = 'RUNNING';
    const tag_id = fileToUpload.fileData.name.replace(/[^A-Za-z1-90-]/g, '-');
    this.uploadingGoes = true;
    this.feedsService
      .getUploadParams(this.caseId, fileToUpload.fileGroup, fileToUpload.extension, 'signs', this.sign?.sign_id as any, tag_id)
      .subscribe(
        res => {
          this.attachedDoc = {
            fileName: file.name,
            progress: 0,
            media: res.fields.key,
            src: ''
          };
          const reader = new FileReader();

          reader.onloadend = () => {
            this.attachedDoc.src = reader.result;
          };

          if (file) {
            reader.readAsDataURL(file);
          } else {
            this.attachedDoc.src = '';
          }

          this.feedsService.filetoAWSUpload(res, file).subscribe((resB: any) => {
            if (resB.type === 1) {
              const percentDone = Math.round((100 * resB['loaded']) / resB['total']);
            } else if (resB.type === 2) {
              this.uploadingGoes = false;
              target.value = '';
              this.attachedDoc['key'] = res.fields.key;
              this.documentKey = res.fields.key;
              this.changeDetector.tick();
              this.save();
            }
          });
        },
        () => {
          this.uploadingGoes = false;
          this.changeDetector.tick();
          this.docData.execution_status = 'FAILED';
        }
      );
  }

  public save() {
    if (!this.docData.display_start) {
      this.signsService.postFormMedia(this.caseId, this.sign?.sign_id as any, this.documentKey).subscribe(
        () => (this.blockFields = false),
        err => {
          const notification: Notification = this.notificationsService.addNotification({
            title: `Saving access `
          });

          this.notificationsService.failed(notification, err.message);
          this.blockFields = false;
        }
      );
    }
    if (this.sign?.sign_id) {
      this.signModel.pages = Array();
      this.signsService.updateForm(this.caseId, this.signModel, this.sign.sign_id).subscribe(
        () => {
          this.blockFields = false;
          this.loadExistingFormInfo();
        },
        err => {
          if (this.signsService.checkRoutes()) {
            const notification = this.notificationsService.addNotification({
              title: `Saving field`
            });

            this.notificationsService.failed(notification, err.message);
          }
        }
      );
    }
  }

  // Get extensions for documents
  private loadExtesions() {
    this.contentMediaService.getExtesions().subscribe(data => (this.supportedExtensions = data));
  }

  private checkFileExtension(file: IFileToUpload): boolean {
    const docsExtensions = Object.keys(this.supportedExtensions.docs);
    const imagesExtensions = Object.keys(this.supportedExtensions.images);
    const isDoc = docsExtensions.some(ext => ext === file.extension);
    const isImage = imagesExtensions.some(ext => ext === file.extension);

    if (isDoc) {
      file.fileGroup = 'docs';
    } else if (isImage) {
      file.fileGroup = 'images';
    }

    return isDoc || isImage;
  }

  public closeModal(): void {
    this.afterChange.emit();
  }

  // Detect changes on event
  private submitModal(): void {
    this.afterChange.emit();
    this.afterSave.emit(this.signModel);
  }
}
