import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import {
  PopInNotificationConnectorService,
  Notification
} from './../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { ContentMediaService } from '../../../services/content-media.service';
import { AmazonService } from '../../../services/amazon.service';
import { StylesService } from '../../../services/styles.service';
import { RolesService } from '../../roles/services/roles.service';
import { FeedMediaService } from '../../../services/feed-media.service';
import { HostService } from '../../../services/host.service';
import { DriveService, ModuleName, IAwsUploadData } from '../../../services/drive.service';
import { OptionsService } from '../../../services/options.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import {
  IMediaExtensions,
  IFeedPost,
  MediaStatus,
  FeedPostStatus,
  IMediaObject,
  IMediaAttachment,
  IFileToUpload,
  IMedia
} from './models/media.model';
import { throwError, Observable, forkJoin } from 'rxjs';
import { catchError, takeUntil, map, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-media',
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.css']
})
export class MediaComponent extends UnsubscriptionHandler implements OnInit, OnDestroy {
  public shownPopUp = false;
  public uploadProgress: any[] = [];
  public mediaAttachments: IMediaAttachment[] = [];
  public supportedExtensions?: IMediaExtensions;
  public feedPosts: IFeedPost[] = [];
  public loading = true;
  public newRecordActive?: boolean;
  public editingAssetId?: string;
  public attachmentsToRemove: IMediaAttachment[] = [];
  public rolesList: any[] = [];
  public rolesNamesById: any = {};
  public acceptedFileExtensions = '';
  public formTouched = false;
  public fileErrorType = '';
  public showViewer = false;
  public viewingItems?: any[];
  public viewerIndx?: number;
  public filesToUpload: IFileToUpload[] = [];
  public uploadingFiles = false;
  public assetId = '';
  public feedPostForm = this.fb.group({
    tag_id: ['', Validators.required],
    message: ['', Validators.required],
    permissions: [[], Validators.required]
  });
  public startKey = '';

  constructor(
    private contentMediaService: ContentMediaService,
    private rolesService: RolesService,
    private amazonService: AmazonService,
    private stylesService: StylesService,
    private feedMediaService: FeedMediaService,
    private notificationsService: PopInNotificationConnectorService,
    private titleService: Title,
    private hostService: HostService,
    private driveService: DriveService,
    private optionsService: OptionsService,
    private fb: UntypedFormBuilder
  ) {
    super();
  }

  ngOnInit() {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.shownPopUp) {
        this.cancelAddingFile();
      }
    });

    this.titleService.setTitle(`${this.hostService.appName} | Library`);

    this.contentMediaService.createFilePopCommand.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      if (!this.loading) {
        this.cancelAddingFile();
        this.shownPopUp = true;
        this.stylesService.popUpActivated();
        this.newRecordActive = true;
      }
    });

    this.loadExtesions();
    this.feedPostForm.reset({ permissions: [] });
    this.showFiles();
    this.loadRolesList();
  }

  public openViewer(post: IFeedPost) {
    this.showViewer = true;
    this.viewerIndx = 0;
    this.viewingItems = [];
    this.viewingItems = this.feedMediaService.loadAllFeedAttachments(post?.media!);
  }

  public viewerClosed() {
    this.showViewer = false;
  }

  public activateEditing(post: IFeedPost) {
    this.assetId = post?.asset_id?.slice(post.asset_id.lastIndexOf('-') + 1)!;
    this.newRecordActive = false;
    this.shownPopUp = true;
    this.stylesService.popUpActivated();
    this.editingAssetId = post.asset_id;

    this.feedPostForm.patchValue({
      tag_id: post.tag_id,
      permissions: post?.permissions?.filter(permission => permission !== 'all') || [],
      message: post.message
    });

    for (const mediaKey in post.media) {
      if (post.media[mediaKey as keyof IMedia]) {
        const mediaObject: IMediaObject = post.media[mediaKey as keyof IMedia];

        if (mediaObject.ct) {
          for (const mediaItemKey of Object.keys(mediaObject.items as any)) {
            const mediaItem = mediaObject?.items![mediaItemKey];

            this.mediaAttachments.push({
              tag_id: mediaItem.tag_id,
              media_group: mediaKey,
              media_id: mediaItemKey,
              status: mediaItem.execution_status,
              src:
                mediaItem.execution_status === MediaStatus.Succeeded && mediaItem.display_start
                  ? this.feedMediaService.getMediaSrc({
                      urlKey: mediaItem.display_start,
                      width: `${mediaItem.display_sizes[mediaItem.display_sizes.length - 2]}`,
                      displayCount: mediaItem.display_count,
                      ext: mediaItem.display_formats[0]
                    })
                  : ''
            });
          }
        }
      }
    }
  }

  public removeRecord(assetId: string) {
    const notification: Notification = this.notificationsService.addNotification({
      title: 'Removing feed '
    });

    this.contentMediaService
      .removeFeedPost(assetId)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, ' Feed removed');
        this.showFiles();
      });
  }

  public showFiles() {
    this.contentMediaService
      .getFeedPosts()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          this.feedPosts = [];
          return throwError(res.error);
        })
      )
      .subscribe(({ items }) => {
        this.feedPosts = items.map((item: any) => {
          item.status = FeedPostStatus.Ready;
          const mediaKeys = item.media ? Object.keys(item.media) : [];

          for (const key of mediaKeys) {
            if (item.media[key].ct) {
              for (const mediaItemKey of Object.keys(item.media[key].items)) {
                item.status =
                  item.media[key].items[mediaItemKey].execution_status === MediaStatus.Failed
                    ? FeedPostStatus.Failed
                    : item.media[key].items[mediaItemKey].execution_status === MediaStatus.Running
                    ? FeedPostStatus.Processing
                    : FeedPostStatus.Ready;

                if (item.status !== FeedPostStatus.Ready) break;
              }

              if (item.status !== FeedPostStatus.Ready) break;
            }
          }

          return item;
        });
        this.loading = false;
      });
  }

  public cancelAddingFile() {
    this.shownPopUp = false;
    this.stylesService.popUpDisactivated();
    this.feedPostForm.reset({ permissions: [] });
    this.mediaAttachments = [];
    this.attachmentsToRemove = [];
    this.formTouched = false;
  }

  public loadExtesions() {
    this.optionsService
      .getExtesions()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: any) => {
        this.supportedExtensions = data;

        this.acceptedFileExtensions = Object.keys(data).reduce(
          (prev, k) =>
            `${prev}${Object.keys(data[k])
              .map(extension => '.' + extension)
              .join(',')},`,
          ''
        );
      });
  }

  public loadRolesList() {
    this.rolesService
      .getRoles()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res: any) => {
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        }
        // this.rolesList = res.items.filter(v => v.role_id !== 'role::bots');
        this.rolesList = res.items;
        this.rolesList.forEach(role => (this.rolesNamesById[role.role_id] = role.name));
      });
  }

  public load_more() {
    this.rolesService
      .getMoreRoles(this.startKey)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res: any) => {
        res.items.map((item: any) => {
          this.rolesList.push(item);
        });
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        } else {
          this.startKey = '';
        }
        this.rolesList.forEach(role => (this.rolesNamesById[role.role_id] = role.name));
      });
  }

  public normilizeRolesList = (permissions: string[]) => permissions.map(v => this.rolesNamesById[v]).join(', ');

  public setPermissions(permissions: string[]) {
    this.feedPostForm.patchValue({ permissions });
  }

  public handleFileUpload(file: FileList, target: HTMLInputElement) {
    const fileToUpload: IFileToUpload = {
      fileData: file[0],
      type: file[0].type.split('/')[0],
      extension: file[0].name.split('.').pop()!.toLowerCase(),
      fileGroup: ''
    };
    const keys = Object.keys(this.supportedExtensions!);
    let supported = false;

    keys.forEach((k: any) => {
      const groupItems = this.supportedExtensions?.[k as keyof IMediaExtensions];
      const groupShort = k.substr(0, k.length - 1);

      for (const extension in groupItems) {
        if (
          extension === fileToUpload.extension &&
          (fileToUpload.type === 'audio' || fileToUpload.type === 'video'
            ? fileToUpload.type.indexOf(groupShort) > -1
            : true)
        ) {
          supported = true;
          fileToUpload.fileGroup = k;

          break;
        }
      }
    });

    if (!supported) {
      return alert('Unsupported file extension.');
    }

    const attachment: IMediaAttachment = {
      tag_id: fileToUpload.fileData.name,
      progress: 0,
      src: ''
    };

    if (fileToUpload.type === 'image') {
      const reader = new FileReader();

      reader.onloadend = () => {
        attachment.src = reader.result!;
      };

      if (fileToUpload.fileData) {
        reader.readAsDataURL(fileToUpload.fileData);
      } else {
        attachment.src = '';
      }
    }

    this.mediaAttachments.unshift(attachment);

    target.value = '';

    this.filesToUpload = [...this.filesToUpload, fileToUpload];
  }

  public shortFileName(value: string, limit: number) {
    return value ? (value.length > limit ? value.substring(0, limit) + '...' : value) : '';
  }

  public removeFile(index: number) {
    this.attachmentsToRemove.push(this.mediaAttachments.splice(index, 1)[0]);
    this.filesToUpload.splice(index, 1);
  }

  public prepareFileForUploading(file: IFileToUpload, assetId: string): Observable<IAwsUploadData> {
    this.fileErrorType = '';

    return this.driveService
      .getUploadingRequestDataPrivate(
        file.fileGroup,
        file.extension,
        ModuleName.Assets,
        this.feedPostForm.controls['tag_id'].value,
        assetId
      )
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.formTouched = true;
          this.fileErrorType = res.errors[0].location;
          return throwError(res.error);
        })
      );
  }

  public uploadFileToAmazon(file: IAwsUploadData, index: number, fileData: File): Observable<any> {
    this.uploadProgress[index] = 0;

    return this.amazonService.filetoAWSUpload(file, fileData).pipe(
      takeUntil(this.unsubscribe$),
      map(res => {
        if (res.type === 1) {
          this.uploadProgress[index] = Math.round((100 * res['loaded']) / res['total']);
        } else if (res.type === 2) {
          this.uploadProgress[index] = 0;
        }
      })
    );
  }

  public removePostMedia() {
    this.attachmentsToRemove.forEach((att: any) => {
      this.contentMediaService
        .removePostMedia(this.editingAssetId!, att.media_group, att.media_id)
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError(res => {
            this.afterActions();
            return throwError(res.error);
          })
        )
        .subscribe(() => this.afterActions());
    });
  }

  public afterActions() {
    this.feedPostForm.reset({ permissions: [] });
    this.cancelAddingFile();
    this.showFiles();
  }

  public onSuccess(notification: Notification, assetId: string, filesRes?: IAwsUploadData[]) {
    const request: any = {
      media: []
    };

    if (filesRes && filesRes.length) {
      filesRes.forEach((att: any) => request.media.push({ media_key: att.fields.key }));

      this.contentMediaService
        .addPostMedia(request, assetId)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(() => {
          if (this.attachmentsToRemove.length) {
            this.removePostMedia();
          } else {
            this.afterActions();
          }
        });
    } else {
      if (this.attachmentsToRemove.length) {
        this.removePostMedia();
      } else {
        this.afterActions();
      }
    }

    if (this.newRecordActive) {
      this.notificationsService.ok(notification, ' Feed added');
    } else {
      this.notificationsService.ok(notification, ' Feed updated');
    }
  }

  savePost() {
    this.formTouched = true;

    if (this.feedPostForm.invalid) {
      return;
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: ''
    });

    if (this.newRecordActive) {
      notification.title = 'Feed adding';

      this.contentMediaService
        .addNewFeedPost(this.feedPostForm.value)
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError(res => {
            this.notificationsService.failed(notification, res.message);
            return throwError(res.error);
          })
        )
        .subscribe(res => this.handleFilesUploading(notification, res.asset_id));
    } else {
      notification.title = 'Feed updating';

      this.contentMediaService
        .updateFeedPost(this.feedPostForm.value, this.editingAssetId!)
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError(res => {
            this.notificationsService.failed(notification, res.message);
            return throwError(res.error);
          })
        )
        .subscribe(res => this.handleFilesUploading(notification, res.asset_id));
    }
  }

  public handleFilesUploading(notification: Notification, assetId: string) {
    if (this.filesToUpload.length) {
      notification.title = 'Files uploading';
      this.uploadingFiles = true;
      const prepareFiles$ = forkJoin(this.filesToUpload.map(file => this.prepareFileForUploading(file, assetId)));
      prepareFiles$.pipe(takeUntil(this.unsubscribe$)).subscribe(filesRes => {
        const uploadFiles$ = forkJoin(
          this.filesToUpload.map((file, index) => this.uploadFileToAmazon(filesRes[index], index, file.fileData))
        );

        uploadFiles$
          .pipe(
            takeUntil(this.unsubscribe$),
            catchError(res => {
              this.notificationsService.failed(notification, res.message);
              return throwError(res.error);
            }),
            finalize(() => {
              this.uploadingFiles = false;
            })
          )
          .subscribe(() => {
            this.onSuccess(notification, assetId, filesRes);
            this.filesToUpload = [];
          });
      });
    } else {
      this.onSuccess(notification, assetId);
    }
  }

  public onFieldNameSave(event: string, attachment: IMediaAttachment, property: any) {
    attachment[property as keyof IMediaAttachment] = event as never;
  }
}
