import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { combineLatest, forkJoin, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, concatMap, map, takeUntil, tap } from 'rxjs/operators';
import { RoleNames } from '@app/interfaces';

import { NotesService } from '../../../services/notes.service';
import { FeedsService } from '../../../services/feeds.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { FeedMediaService, IAllowedFileSizes, MediaItemData } from '../../../services/feed-media.service';
import { SchemaService } from '../../../services/schema.service';
import { RolesService } from '../../../services/roles.service';
import { CasesService } from '../../../services/cases.service';
import { UtilsService } from '../../../services/utils.service';
import { NoteModel } from '../../../models/NoteModel';
import { UserService } from '../../../services/user.service';
import { IAwsUploadData, IFileToUpload, IMediaAttachment } from '../../feeds/models/feed.model';
import { HostService } from '../../../services/host.service';

@Component({
  selector: 'app-create-note',
  templateUrl: './create-note.component.html',
  styleUrls: ['./create-note.component.css']
})
export class CreateNoteComponent implements OnInit, OnDestroy {
  public caseId?: string;
  public viewerIndx?: number;
  public showViwer?: boolean;
  public viewerItems?: any[];
  public permissions: RoleNames[] = [];
  public noteSchema: any;
  public noteUiSchema: any;
  public formData: any = {};
  public noteModel = new NoteModel();
  public loading = true;
  public isNoteCreate = true;
  public loadedAttachments: MediaItemData[] = [];
  public supportedExtensions: any;
  public blockAddingNote = false;
  public waitingAttachments: IMediaAttachment[] = [];
  public removeAttchments: MediaItemData[] = [];
  public uploadProgress: any = {};
  public textAreaMinHeight = '170px';
  public validationErrors: string[] = [];

  private params$ = this.route.paramMap;
  private case$ = this.caseService.getCaseId;
  private noteId?: string;
  private allowedFileSizes?: IAllowedFileSizes;
  private filesToUpload: IFileToUpload[] = [];
  private unsubscribe$: Subject<void> = new Subject();

  get disableEdit(): boolean {
    return this.route.snapshot.data['viewOnly'];
  }

  constructor(
    public notesService: NotesService,
    private feedsService: FeedsService,
    private feedMediaService: FeedMediaService,
    private notificationsService: PopInNotificationConnectorService,
    private schemaService: SchemaService,
    private rolesService: RolesService,
    private caseService: CasesService,
    private router: Router,
    private utils: UtilsService,
    private route: ActivatedRoute,
    private userService: UserService,
    private titleService: Title,
    private hostService: HostService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Notes`);
    this.viewerIndx = 0;
    this.showViwer = false;
    this.viewerItems = [];
    this.rolesService.rolesGetSub
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(roles => (this.permissions = roles.filter((v) => v.role_id !== 'role::bots')));

    combineLatest([this.case$, this.params$])
      .pipe(
        takeUntil(this.unsubscribe$),
        map(([caseData, param]) => {
          return [caseData.case_id, (param as any).params.id];
        }),
        tap(([caseId, id]) => {
          this.noteId = id;
          this.caseId = caseId;
        }),
        concatMap(() =>
          forkJoin([this.noteId ? of(null) : this.schemaService.getSchemas(), this.feedsService.getExtesions()])
        ),
        tap(([r1, r2]) => {
          this.noteSchema = this.noteId
            ? null
            : r1.default_schemas.notes && r1.default_schemas.notes[0] && r1.default_schemas.notes[0].schema
            ? r1.default_schemas.notes[0].schema
            : null;
          this.noteUiSchema = this.noteId
            ? null
            : r1.default_schemas.notes && r1.default_schemas.notes[0] && r1.default_schemas.notes[0].ui_schema
            ? r1.default_schemas.notes[0].ui_schema
            : null;
          this.supportedExtensions = r2;
        }),
        concatMap(() => this.loadingNoteInfo(this.noteId as any)),
        tap((res: any) => {
          if (res === null) {
            this.noteModel.permissions = this.permissions.map(role => role.role_id);
            return; // It means user opened create page and not edit
          }

          if (res.media_ct) {
            this.loadedAttachments = [];

            const mediaKeys = Object.keys(res.media);

            mediaKeys.forEach(key => {
              const media = res.media[key];

              if (media.ct) {
                for (const mediaItemKey of Object.keys(media.items)) {
                  const mediaItem = media.items[mediaItemKey];
                  mediaItem.media_id = mediaItemKey;
                  mediaItem.thumbnail = this.feedMediaService.getThumbnail(mediaItem, 90);

                  this.loadedAttachments.push(mediaItem);
                }
              }
            });
          }
          this.noteSchema = res.pages && res.pages[0] && res.pages[0].schema ? res.pages[0].schema : null;
          this.noteUiSchema = res.pages && res.pages[0] && res.pages[0].ui_schema ? res.pages[0].ui_schema : null;
          this.noteModel.permissions = res.permissions ? res.permissions : this.permissions.map(role => role.role_id);
          this.noteModel.notes = res.notes;
          this.noteModel.note_id = this.noteId;
          this.noteModel.media = res.media;
          this.isNoteCreate = false;
          this.loading = false;
        })
      )
      .subscribe(
        () => {
          this.loading = false;
        },
        err => {
          const notification: Notification = this.notificationsService.addNotification({
            title: `Loading Note`
          });
          this.notificationsService.failed(notification, err.message);
          this.loading = false;
        }
      );

    this.userService.getCasePermissionsData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      if (data.role.file_size) {
        this.allowedFileSizes = data.role.file_size;
      }
    });
  }

  // Load note info
  public loadingNoteInfo(noteId: string): Observable<any> {
    this.loading = true;
    this.blockAddingNote = false;
    this.waitingAttachments = [];
    this.filesToUpload = [];
    this.removeAttchments = [];
    this.loadedAttachments = [];

    return this.notesService.getNote(this.caseId as any, noteId);
  }

  public setPermissions(permissions: string[]) {
    this.noteModel.permissions = permissions;
  }

  // Back to the note
  public gotoNote(): void {
    this.refreshModal();
    this.notesService.refreshNotesList();
    this.router.navigate(['notes']);
  }

  // Create or update note
  public createNote(): void {
    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving Note`
    });
    const noteModel = this.utils.copy(this.noteModel);

    if (this.isNoteCreate && noteModel.permissions && noteModel.permissions.length === this.permissions.length) {
      delete noteModel.permissions;
    }

    this.blockAddingNote = true;

    if (this.isNoteCreate) {
      delete noteModel.media_post_id;

      this.notesService
        .createNote(this.caseId as any, noteModel)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(
          ({ note_id }) => this.handleFilesUploading(note_id, notification),
          err => {
            this.notificationsService.failed(notification, err.message);
            this.blockAddingNote = false;
          }
        );
    } else {
      this.notesService
        .updateNote(this.caseId as any, noteModel)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(
          ({ note_id }) => {
            if (this.filesToUpload.length) {
              this.handleFilesUploading(note_id, notification);
            } else {
              this.onsaveActions(notification);
            }

            if (this.removeAttchments.length) {
              this.removeMediaFromNote(note_id, this.removeAttchments, notification);
            }
          },
          err => {
            this.notificationsService.failed(notification, err.message);
            this.blockAddingNote = false;
          }
        );
    }
  }

  // Handling file upload
  public handleFileUpload(target: HTMLInputElement): void {
    if (!target.files) return;
    for (var i = 0; i < target.files.length; i++) {
      const file: File = target.files[i];
      const fileSize = +(Math.ceil(file.size / 100000) / 10).toFixed(1);
      const fileExt = file.name.split('.').pop()!.toLowerCase();
      const fileToUpload: IFileToUpload = {
        fileData: file,
        type: file.type.split('/')[0],
        extension: fileExt,
        fileGroup: this.getFileGroup(fileExt)
      };
      const attachment: IMediaAttachment = {
        tag_id: fileToUpload.fileData.name,
        progress: 0,
        src: ''
      };

      if (fileSize > this.allowedFileSizes![fileToUpload.fileGroup as keyof IAllowedFileSizes]) {
        this.notificationsService.addNotification({
          title: 'Entity Too Large',
          text: `Your proposed upload exceeds the maximum allowed size`,
          status: 'error',
          width: '430px'
        });
        target.value = '';
        return;
      }

      if (fileToUpload.type === 'image') {
        const reader = new FileReader();

        reader.onloadend = () => {
          attachment.src = this.sanitizer.bypassSecurityTrustResourceUrl(reader.result as any);
        };

        if (fileToUpload.fileData) {
          reader.readAsDataURL(fileToUpload.fileData);
        } else {
          attachment.src = '';
        }
      }

      this.waitingAttachments.unshift(attachment);
      this.filesToUpload = [...this.filesToUpload, fileToUpload];
    }
    target.value = '';
  }

  public shortFileName(val: string, am: number): string {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  public removeAttachment(index: number): void {
    this.waitingAttachments.splice(index, 1);
    this.filesToUpload.splice(index, 1);
  }

  // Hide modal window and refresh note model
  public refreshModal(): void {
    this.notesService.showCreateNoteModal = false;
    this.noteModel = new NoteModel();
    this.loadedAttachments = [];
    this.filesToUpload = [];
    this.waitingAttachments = [];
    this.isNoteCreate = true;
    this.blockAddingNote = false;
  }

  public viewAttachments(note: NoteModel, attachmentIndex: number): void {
    this.viewerIndx = attachmentIndex;
    this.showViwer = true;
    this.viewerItems = [];

    const media: any = this.feedMediaService.loadAllFeedAttachments(note.media, note.note_id as any, this.caseId as any);

    Object.keys(media).map(v => {
      const list = media[v].list;

      list.map((vl: any) => {
        this.viewerItems?.push(this.feedMediaService.getViwerObject(vl));
      });
    });
  }

  public updateNoteModel(value: any) {
    setTimeout(() => {
      this.noteModel.notes = [value];
    }, 0);
  }

  private getFileGroup(extension: string): string {
    let fileGroup = 'files';

    for (const group in this.supportedExtensions) {
      if (Object.prototype.hasOwnProperty.call(this.supportedExtensions, group)) {
        const extensionFound = Object.keys(this.supportedExtensions[group]).some(ext => ext === extension);

        if (extensionFound) {
          fileGroup = group;
        }
      }
    }

    return fileGroup;
  }

  private onsaveActions(notification: Notification): void {
    this.notificationsService.ok(notification, 'Note saved');
    this.refreshModal();
    this.notesService.refreshNotesList();
    this.router.navigate(['notes']);
  }

  private handleFilesUploading(noteId: string, notification: Notification) {
    if (this.filesToUpload.length) {
      const prepareFiles$ = forkJoin(this.filesToUpload.map(file => this.prepareFileForUploading(file, noteId)));

      prepareFiles$.pipe(takeUntil(this.unsubscribe$)).subscribe(filesRes => {
        const uploadFiles$ = forkJoin(
          this.filesToUpload.map((file, index) => this.uploadFileToAmazon(filesRes[index], index, file.fileData))
        );

        uploadFiles$
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe(() => this.attachMediaToNote(noteId, filesRes, notification));
      });
    } else {
      this.onsaveActions(notification);
    }
  }

  private prepareFileForUploading(file: IFileToUpload, noteId: string): Observable<IAwsUploadData> {
    const fileName = file.fileData.name.replace(/\./g, '-');

    return this.feedsService
      .getUploadParams(this.caseId as any, file.fileGroup, file.extension, 'notes', noteId, fileName)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.blockAddingNote = false;
          return throwError(res.error);
        })
      );
  }

  private uploadFileToAmazon(file: IAwsUploadData, index: number, fileData: File): Observable<any> {
    this.uploadProgress[index] = 0;

    return this.feedsService.filetoAWSUpload(file, fileData).pipe(
      takeUntil(this.unsubscribe$),
      map((res: any) => {
        if (res.type === 1) {
          const percentDone = Math.round((100 * res['loaded']) / res['total']);

          this.uploadProgress[index] = percentDone + '%';
        } else if (res.type === 2) {
          this.uploadProgress[index] = '0%';
        }
      })
    );
  }

  private attachMediaToNote(noteId: string, filesRes: IAwsUploadData[], notification: Notification) {
    const request: any = {
      media: []
    };

    filesRes.forEach(att => request.media.push({ media_key: att.fields.key }));

    this.notesService
      .attachMediaToNote(this.caseId as any, noteId, request)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => this.onsaveActions(notification),
        err => {
          this.notificationsService.failed(notification, err.message);
          this.blockAddingNote = false;
        }
      );
  }

  private removeMediaFromNote(noteId: string, filesRes: any[], notification: Notification) {
    const removeFiles$ = forkJoin(
      filesRes.map(file => this.notesService.removeMediaFromNote(this.caseId as any, noteId, file.media_group, file.media_id))
    );

    removeFiles$.subscribe(
      () => {
        if (!this.filesToUpload.length) {
          this.onsaveActions(notification);
        }
      },
      err => {
        this.notificationsService.failed(notification, err.message);
        this.blockAddingNote = false;
      }
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
