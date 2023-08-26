import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
  QueryList,
  ViewChildren
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl, Title } from '@angular/platform-browser';

import { Subject, forkJoin, Observable, throwError, combineLatest, of } from 'rxjs';
import { takeUntil, catchError, map, finalize, tap, take } from 'rxjs/operators';
import { CaseStatus } from '@app/types';
import { Team, Role, CommentListItem, CommentListResponse } from '@app/interfaces';

import { ChoiceWithIndices } from '@flxng/mentions';

import { CasesService } from '../../../services/cases.service';
import { FeedsService } from '../../../services/feeds.service';
import { CommentsService } from '../../../services/comments.service';
import { GarbageCollectorService } from '../../../services/garbage-collector.service';
import { UserService } from '../../../services/user.service';
import { FeedMediaService, ExtensionsResponse, IAllowedFileSizes, AttachmentForViewer } from '../../../services/feed-media.service';
import { RolesService } from '../../../services/roles.service';
import { StylesService } from '../../../services/styles.service';
import { UtilsService } from '../../../services/utils.service';
import { HostService } from '../../../services/host.service';
import { Template } from '../../../models/Template';
import { IFileToUpload, IMediaAttachment, IAwsUploadData, IFeed, MediaStatus } from '../models/feed.model';
import { PopInNotificationConnectorService } from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { PostComment } from './interfaces/post-comment.interface';
import { MediaParent } from './types/media-parent.type';

@Component({
  selector: 'app-feeds',
  templateUrl: './feeds.component.html',
  styleUrls: ['./feeds.component.css']
})
export class FeedsComponent implements OnInit, OnDestroy {
  @ViewChild('feedInput') feedInput?: ElementRef;

  @ViewChildren('feedPost') set content(content: QueryList<ElementRef>) {
    // initially setter gets called with undefined
    if (content && content?.length) {
      this._feedPosts = content;

      if (this.feedsService.directLink?.id) {
        this.scrollToFeedElement();
      }
    }
  }

  get feedPosts() {
    return this._feedPosts;
  }

  public blockAddingFeed = false;
  public commentsToPost: { [key: string]: string } = {};
  public commentsActiveEdit: any = {};
  public commentsToEdit: { [key: string]: { [key: number]: string } } = {};
  public feedsList: IFeed[] = [];
  public permissions!:  { [key: string]: string };
  public loading = false;
  public message = '';
  public loadedAttachments: ExtensionsResponse[] = [];
  public loadedComments: any[] = [];
  public moreCommentsLoading: number = -1;
  public supportedExtensions: any;
  public teamData: { [key: string]: Team } = {};
  public uploadProgress: any = {};
  public waitingAttachments: IMediaAttachment[] = [];
  public userId = '';
  public showViwer = false;
  public viewerIndx = 0;
  public viewiengItems: any[] = [];
  public newFeedPermissions: string[] = [];
  public rolesList: Role[] = [];
  public showFilesList = false;
  public templates: Template[] = [];
  public avatarUrl?: SafeResourceUrl;
  public feedTouch = false;
  public caseId = '';
  public mediaFilter = '';
  public templatesLoading = true;
  public selectedTemplate?: any;
  public templateData: Template = {
    asset_id: '',
    tag_id: '',
    message: '',
    files: []
  };
  public validationErrors: string[] = [];
  public feedValidationErrors: string[] = [];
  public expandFeedInput = false;
  public filteredChoices?: any;
  public selectedChoices: any = {};
  public botsRole = 'role::bots';
  public currentCaseStatus$: Observable<CaseStatus | undefined>;
  public todos$?: Observable<any>;

  private filesToUpload: IFileToUpload[] = [];
  private deleteCommentGoes = false;
  private firstInit = true;
  private componentActive = true;
  private unsubscribe$: Subject<void> = new Subject();
  private notUploadedFilesIndexes: number[] = [];
  private allowedFileSizes?: IAllowedFileSizes;
  private _feedPosts?: QueryList<ElementRef>;

  @HostListener('document:click', ['$event'])
  clickOut(event: Event) {
    if (!((event.target as HTMLElement).classList.contains('icon-x-circle') || (event.target as HTMLElement).closest('.menu-template-container'))) {
      this.expandFeedInput = this.feedInput?.nativeElement.contains(event.target) || false;
    }
  }

  constructor(
    public utilsService: UtilsService,
    private caseService: CasesService,
    private feedsService: FeedsService,
    private commentsService: CommentsService,
    private garbageCollectorService: GarbageCollectorService,
    private userService: UserService,
    private feedMediaService: FeedMediaService,
    private rolesService: RolesService,
    private stylesService: StylesService,
    private sanitizer: DomSanitizer,
    private hostService: HostService,
    private titleService: Title,
    private notificationsService: PopInNotificationConnectorService
  ) {
    this.currentCaseStatus$ = this.caseService.activeCaseObs$.pipe(map(data => data?.status));
  }

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Feed`);
    this.stylesService.popUpDisactivated();
    this.userId = this.userService?.userData?.['user_id'];
    this.avatarUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.userService.getAvatarUrl(50));

    this.caseService.getCaseId.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      if (!this.componentActive) {
        return;
      }

      this.caseId = res['case_id'];
      this.todos$ = this.userService.getToDos(this.caseId, 'uncompleted');
      this.loadExtesions();
    });

    if (this.caseId) {
      if (!this.componentActive) {
        return;
      }

      if (this.userService.rolesPermissions[this.caseId]) {
        this.permissions = {};
        this.userService.rolesPermissions[this.caseId].data.permissions.posts.map((v: any) => (this.permissions[v] = v));
      }
    }

    // this.userService.getTeamData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
    //   if (data) {
    //     data.items.map(usr => (this.teamData[usr.user_id] = usr));
    //   }
    // });

    combineLatest([this.userService.getTeamData, this.userService.getCasePermissionsData])
      .pipe(
        takeUntil(this.unsubscribe$),
        tap(([teamData, permissionsData]) => {
          if (teamData) {
            teamData.items.map((usr) => (this.teamData[usr.user_id] = usr));
          }

          this.permissions = {};

          if (permissionsData.role.permissions.posts) {
            permissionsData.role.permissions.posts.map((v) => (this.permissions[v] = v));
          }

          if (permissionsData.role.file_size) {
            this.allowedFileSizes = permissionsData.role.file_size;
          }

          this.loading = true;

          this.showFeedsList(true);
        })
      )
      .subscribe();

    if (this.userService.casePermissionsData) {
      this.permissions = {};

      this.userService.casePermissionsData.role.permissions.posts.map((v: any) => {
        this.permissions[v] = v;
      });
    }

    // this.userService.getCasePermissionsData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
    //   this.permissions = {};
    //
    //   if (data.role.permissions.posts) {
    //     data.role.permissions.posts.map(v => (this.permissions[v] = v));
    //   }
    //
    //   if (data.role.file_size) {
    //     this.allowedFileSizes = data.role.file_size;
    //   }
    //
    //   this.loading = true;
    //   this.showFeedsList();
    // });

    this.garbageCollectorService.destroyCommand.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.ngOnDestroy();
    });

    this.rolesList = this.rolesService.rolesList;

    this.rolesService.rolesGetSub.pipe(takeUntil(this.unsubscribe$)).subscribe(r => {
      this.newFeedPermissions = r.filter((v) => v.role_id !== 'role::bots').map((role) => role.role_id);
      this.rolesList = r.filter((v) => v.role_id !== 'role::bots');
    });

    if (this.firstInit) {
      // add global click event listener, to close all feeds context menus
      document.addEventListener('click', function (event) {
        if (!(event.target as HTMLElement)['closest']('.more-to-feed-menu')) {
          const allMenus = document.querySelectorAll('.more-to-feed-menu');
          const len = allMenus.length;

          for (let i = 0; i < len; i++) {
            allMenus[i].classList.remove('expanded');
          }
        }
      });

      this.firstInit = false;
    }
  }

  private scrollToFeedElement() {
    const index = this.feedsList.findIndex(element => element.post_id === this.feedsService?.directLink?.id);

    if (index !== -1) {
      this.feedPosts!.toArray()[index].nativeElement.scrollIntoView();

      this.feedsService.directLink = null;
    }
  }

  public identify(_: number, item: IFeed): string {
    return item.post_id;
  }

  public commentsTrackBy(_: number, item: CommentListItem): string {
    return item.comment_id;
  }

  public postFeed(): void {
    if (this.message.trim() === '') {
      this.feedTouch = true;
      return;
    }

    let message = this.message;

    this.selectedChoices?.feed?.forEach((item: any) => {
      message = message.split(`@${item?.choice?.value?.given_name}`).join(`<@${item?.choice?.value?.user_id}>`);
    });

    const reqData: any = {
      message
    };

    if (this.newFeedPermissions.length !== this.rolesList.length) {
      reqData.permissions = this.newFeedPermissions;
    }

    if (this.templateData.asset_id) {
      reqData.media_asset_id = this.templateData.asset_id;
    }

    this.blockAddingFeed = true;

    // Post feed Message
    this.feedsService
      .addFeed(this.caseId, reqData)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        res => {
          if (this.componentActive) {
            this.handleFilesUploading(res.post_id);
          }
        },
        err => {
          if (this.componentActive) {
            if (err.status === 201) {
              this.message = '';
              this.showFeedsList();
              this.waitingAttachments = [];
              this.resetTemplateData();
            }

            this.blockAddingFeed = false;
            this.feedTouch = false;
          }
        }
      );
  }

  public sortDateByProperty(arr: any, prop: any): any {
    arr.sort((a: any, b: any) => {
      a = new Date(a[prop]);
      b = new Date(b[prop]);
      return b > a ? -1 : b < a ? 1 : 0;
    });

    arr.map((c: any, i: number) => (arr[i].post_index = i));

    return arr;
  }

  public deleteFeed(i: number, target: HTMLElement): void {
    target?.closest('.more-to-feed-menu')?.classList.remove('expanded');

    this.feedsService
      .deleteFeedItem({
        case_id: this.caseId,
        post_id: this.feedsList[i]['post_id']
      })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        if (this.componentActive) {
          this.feedsList.splice(i, 1);
          this.loadedComments.splice(i, 1);
          this.loadedAttachments.splice(i, 1);
        }
      });
  }

  public editFeed(index: number, event: any): void {
    event.target.closest('.more-to-feed-menu').classList.remove('expanded');

    this.feedsList[index].activeEditing = true;
    this.feedsList[index].replacePermissions =
      this.feedsList[index].permissions && this.feedsList[index].permissions.length
        ? this.feedsList[index].permissions
        : this.rolesList.map(role => role.role_id);
  }

  public cancelFeedEdit(feed: IFeed, i: number): void {
    this.feedsList[i]['activeEditing'] = false;
    feed.replaceMessage = feed.message;
    feed.replacePermissions = feed.permissions.slice();
  }

  public updateFeed(feed: IFeed, index: number): void {
    this.feedsList[index]['loading'] = true;

    let message: any = feed.replaceMessage;

    this.selectedChoices[feed.post_id]?.forEach((item: any) => {
      message = message.split(`@${item?.choice?.value?.given_name}`).join(`<@${item?.choice?.value?.user_id}>`);
    });

    feed.message = message;
    feed.permissions = feed.replacePermissions as any;

    this.feedsService
      .updateFeed(this.caseId, feed.post_id, feed)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {
          if (this.componentActive) {
            this.feedsList[index]['message'] = feed.replaceMessage as any;
            this.feedsList[index]['activeEditing'] = false;
            this.feedsList[index]['loading'] = false;
          }
        },
        () => {
          this.feedsList[index]['loading'] = false;
        }
      );
  }

  public handleFileUpload(event: Event, mediaParentType: MediaParent = 'post', postId: string): void {
    const target = event.target as HTMLInputElement;
    if (!target.files) return;
    for (let i = 0; i < target.files.length; i++) {
      const file: File = target.files[i];
      const fileSize = (Math.ceil(file.size / 100000) / 10).toFixed(1);
      const fileExt = file.name.split('.').pop()!.toLowerCase();
      const fileToUpload: IFileToUpload = {
        fileData: file,
        type: file.type.split('/')[0],
        extension: fileExt,
        fileGroup: this.getFileGroup(fileExt),
        mediaParentType,
        postId
      };

      const attachment: IMediaAttachment = {
        tag_id: fileToUpload.fileData.name,
        progress: 0,
        src: '',
        mediaParentType,
        postId
      };

      if (+fileSize > this.allowedFileSizes![fileToUpload.fileGroup as keyof IAllowedFileSizes]) {
        this.notificationsService.addNotification({
          title: 'Entity Too Large',
          text: `Your proposed upload exceeds the maximum allowed size`,
          status: 'error',
          width: '430px'
        });
        target.value = '';
        return;
      }

      if (parseFloat(fileSize) <= 0) {
        this.notificationsService.addNotification({
          title: 'Entity Too Small',
          text: `Your proposed upload exceeds the minimum allowed size`,
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

      this.waitingAttachments.push(attachment);
      this.filesToUpload = [...this.filesToUpload, fileToUpload];
    }
    target.value = '';
  }

  public removeAttachment(index: number, mediaParentType: MediaParent = 'post', postId: string): void {
    const specificAttachments = this.waitingAttachments.filter((attachment) => attachment.mediaParentType === mediaParentType && postId === attachment.postId);
    specificAttachments.splice(index, 1);
    this.waitingAttachments = [...this.waitingAttachments.filter((attachment) => attachment.postId !== postId), ...specificAttachments];
    const specificFiles = this.filesToUpload.filter((file) => file.mediaParentType === mediaParentType && postId === file.postId);
    specificFiles.splice(index, 1);
    this.filesToUpload = [...this.filesToUpload.filter((file) => file.postId !== postId), ...specificFiles];
  }

  public shortFileName(val: string, am: number): string {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  public postComment(feedId: string, lid: number): void {
    let requestMessage: string = this.commentsToPost[feedId];
    if (!requestMessage) return;

    for (const [key, value] of Object.entries(this.teamData)) {
      requestMessage = requestMessage.split(`@${(value as any).given_name}`).join(`<@${key}>`);
    }

    const postText = this.commentsToPost[feedId];

    if (postText.trim() !== '') {
      this.commentsService
        .addComment(this.caseId, feedId, { message: requestMessage })
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((newComment) => {
          if (!this.componentActive) {
            return;
          }

          this.commentsToPost[feedId] = '';
          this.feedsList[lid].comments_ct++;

          if (!this.loadedComments[lid]) {
            this.loadedComments[lid] = [];
          }

          this.loadedComments[lid].push({
            message: postText,
            user_id: this.userService.userData?.['user_id'],
            created_on: new Date(),
            comment_id: newComment.comment_id
          });
          this.commentsToEdit[this.loadedComments[lid].length - 1] = {};
          this.handleFilesUploading(feedId, 'comment', newComment.comment_id, lid);
        });
    }
  }

  public editComment(comment: PostComment, post_id: string): void {
    comment.key = comment.post_index;
    if (!this.commentsActiveEdit[post_id]) {
      this.commentsActiveEdit[post_id] = {};
    }

    if (!this.commentsToEdit[post_id]) {
      this.commentsToEdit[post_id] = {};
    }

    this.commentsActiveEdit[post_id][comment.post_index] = comment;
    this.commentsToEdit[post_id][comment.post_index] = comment.message;
  }

  public cancelCommentEditing(post_id: string, i: number, commentID: number): void {
    this.commentsActiveEdit[post_id][commentID] = false;
    this.commentsToEdit[post_id][commentID] = '';
  }

  public updateComment(post_id: string, i: number, comment: CommentListItem): void {
    let requestMessage: string = this.commentsToEdit[post_id][comment.post_index!];

    for (const [key, value] of Object.entries(this.teamData)) {
      requestMessage = requestMessage.split(`@${(value as any).given_name}`).join(`<@${key}>`);
    }

    this.commentsService
      .updateComment(this.caseId, post_id, comment.comment_id, {
        message: requestMessage
      })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.loadedComments[i][this.commentsActiveEdit[post_id][comment.post_index!].key].message =
          this.commentsToEdit[post_id][comment.post_index!];
        this.commentsActiveEdit[post_id][comment.post_index!] = false;
        this.commentsToEdit[post_id][comment.post_index!] = '';
      });
  }

  public deleteComment(feedPostId: string, commentPostId: string, parentIndex: number): void {
    if (this.deleteCommentGoes) {
      return;
    }
    this.moreCommentsLoading = parentIndex;
    this.deleteCommentGoes = true;

    this.commentsService
      .deleteComment({
        case_id: this.caseId,
        parent_id: feedPostId,
        post_id: commentPostId
      })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {
          this.feedsList[parentIndex].comments_ct--;
          this.getComments(feedPostId, parentIndex, this.feedsList[parentIndex].showAllComments ? undefined : 2);
          this.deleteCommentGoes = false;
          this.moreCommentsLoading = -1;
        },
        err => {
          if (err.status === 204) {
            this.feedsList[parentIndex].comments_ct--;
            this.getComments(feedPostId, parentIndex, this.feedsList[parentIndex].showAllComments ? undefined : 2);
          } else {
            alert(err);
          }
          this.deleteCommentGoes = false;
          this.moreCommentsLoading = -1;
        }
      );
  }

  public toggleMenuClass(event: Event): void {
    (event.target as HTMLElement).classList.toggle('expanded');
  }

  public removeFeedAttachment(feed: IFeed, i: number, doc: any, typeKey: any, ind: any, comment?: any): void {
    const elements = JSON.parse(JSON.stringify(this.loadedAttachments));

    if (comment) {
      this.feedsService
        .removeMediaFromComment(this.caseId, feed.post_id, comment.comment_id, {media_group: doc.media_group, media_id: doc.media_id})
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(() => {
          const index = this.loadedAttachments[i][typeKey as keyof ExtensionsResponse].list
            .findIndex((el: any) => el.commentId === comment.comment_id)
          elements[i][typeKey as keyof ExtensionsResponse].list.splice(index, 1);

          this.loadedAttachments = elements;
        });
    } else {
      this.feedsService
        .removeMedia(this.caseId, feed.post_id, doc.media_group, doc.media_id)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(() => {
          elements[i][typeKey as keyof ExtensionsResponse].list.splice(ind, 1);
  
          this.loadedAttachments = elements;
        });
    }
  }

  public viewerClosed(): void {
    this.showViwer = false;
  }

  public showInViewer(loadedAttachments: ExtensionsResponse, index: number): void {
    this.viewiengItems = [];
    this.viewerIndx = index;

    Object.keys(loadedAttachments).map(v => {
      const list = loadedAttachments[v as keyof ExtensionsResponse].list;

      this.viewiengItems = [...this.viewiengItems, ...list.map((vl: any) => this.feedMediaService.getViwerObject(vl))];
    });
    this.showViwer = true;
  }

  public downloadDoc(doc: any, $event: any): void {
    $event.stopPropagation();
    this.feedMediaService.downloadDocument(doc.downloadLink);
  }

  public showTemplates(): void {
    this.loadTemplates();
    this.showFilesList = true;
    this.stylesService.popUpActivated();
  }

  public hidePopUp(): void {
    this.showFilesList = false;
    this.selectedTemplate = null;
    this.stylesService.popUpDisactivated();
  }

  public closeLibraryPopUp(): void {
    this.resetTemplateData();
    this.hidePopUp();
  }

  public attachFileFromLib(event: any, postItemData: Template): void {
    this.selectedTemplate = event.target.checked ? postItemData : null;
  }

  public selectTemplate() {
    this.templateData = this.selectedTemplate;
    this.hidePopUp();
  }

  public loadChoices(filterValue: string) {
    return (this.filteredChoices = this.filterObjectFunction(filterValue));
  }

  public onSelectedChoicesChange(event: ChoiceWithIndices[], postId: string): void {
    this.selectedChoices[postId] = event;
  }

  public onMenuShow(): void {
    this.filteredChoices = JSON.parse(JSON.stringify(this.teamData));
  }

  public onMenuHide(): void {}

  public getChoiceLabel(user: any): string {
    return `@${user?.value?.given_name}`;
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

  private handleFilesUploading(postId: string, mediaParentType: MediaParent = 'post', commentId?: string, commentParentIndex?: number) {
    if (this.filesToUpload.length) {
      const prepareFiles$ = forkJoin(this.filesToUpload.filter(file => file.mediaParentType === mediaParentType && (file.postId === postId || file.postId === '0')).map(file => this.prepareFileForUploading(file, postId)));

      prepareFiles$.pipe(takeUntil(this.unsubscribe$)).subscribe(filesRes => {
        const uploadFiles$ = forkJoin(
          this.filesToUpload.filter(file => file.mediaParentType === mediaParentType && (file.postId === postId || file.postId === '0')).map((file, index) => this.uploadFileToAmazon(filesRes[index], index, file.fileData))
        );

        uploadFiles$
          .pipe(
            takeUntil(this.unsubscribe$),
            finalize(() => {
              const successfullyUploadedFiles = filesRes.filter(
                (file, fileIndex) => !this.notUploadedFilesIndexes.includes(fileIndex)
              );

              if (successfullyUploadedFiles.length) {
                this.attachMediaToPost(postId, successfullyUploadedFiles, commentId, commentParentIndex);
              } else {
                this.finishPostCreating();
              }

              if (this.notUploadedFilesIndexes.length) {
                this.notificationsService.addNotification({
                  title: 'Entity Too Large',
                  text: `Your proposed upload exceeds the maximum allowed size`,
                  status: 'error',
                  width: '430px'
                });
              }

              this.notUploadedFilesIndexes = [];
              this.uploadProgress = {};
            })
          )
          .subscribe();
      });
    } else {
      this.message = '';
      this.blockAddingFeed = false;
      this.newFeedPermissions = this.rolesList.map(role => role.role_id) as string[];
      if (!commentId) {
        this.showFeedsList();
      }
      this.resetTemplateData();
    }

    this.feedTouch = false;
  }

  private prepareFileForUploading(file: IFileToUpload, postOrCommentId: string, mediaParentType: MediaParent = 'post'): Observable<IAwsUploadData> {
    const tag_id = file.fileData.name.replace(/[^A-Za-z1-90-]/g, '-');

    return this.feedsService.getUploadParams(this.caseId, file.fileGroup, file.extension, mediaParentType + 's', postOrCommentId, tag_id).pipe(
      takeUntil(this.unsubscribe$),
      catchError(res => {
        this.blockAddingFeed = false;
        return throwError(res.error);
      })
    );
  }

  public uploadFileToAmazon(file: IAwsUploadData, index: number, fileData: File): Observable<void> {
    this.uploadProgress[index] = 0;

    return this.feedsService.filetoAWSUpload(file, fileData).pipe(
      takeUntil(this.unsubscribe$),
      map((res: any) => {
        if (res.type === 1) {
          const percentDone = Math.round((100 * res['loaded']) / res['total']);

          this.uploadProgress[index] = percentDone + '%';
        } else if (res.type === 2 || res.type === 3) {
          this.uploadProgress[index] = '0%';
        }
      }),
      catchError(() => {
        this.notUploadedFilesIndexes.push(index);
        return throwError(index);
      })
    );
  }

  public attachMediaToPost(postId: string, filesRes: IAwsUploadData[], commentId?: string, commentParentIndex?: number): void {
    const request: { media: { media_key: string }[]} = {
      media: []
    };

    filesRes.forEach(att => request.media.push({ media_key: att.fields.key }));
    if (commentId) {
      this.feedsService.attachMediaToComment(this.caseId, postId, commentId, request).pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.waitingAttachments = this.waitingAttachments.filter(attachment => attachment.postId !== postId);
        this.filesToUpload = this.filesToUpload.filter(file => file.postId !== postId);
        this.getComments(postId, commentParentIndex!, 2);
        this.resetTemplateData();
      });
      return;
    }

    this.feedsService
      .attachMediaToPost(this.caseId, postId, request)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => this.finishPostCreating());
  }

  public feedShowAddComments(feed: any): void {
    feed.showCommens = false;
    feed.showAddComment = !feed.showAddComment;
  }

  public feedShowComments(feed: any): void {
    feed.showAddComment = false;
    feed.showCommens = !feed.showCommens;
  }

  public viewTasks(): void {
    this.userService.openToDosMobile.next();
  }

  public closeToDoTasks(el: HTMLDivElement): void {
    el.classList.add('display-none');
  }

  public onScrollingFinished(feedItem: IFeed, indexInFeedsList: number): void {
    if (!feedItem.comments_ct) return;
    this.getComments(feedItem.post_id, indexInFeedsList, 2);
  }

  public getComments(postId: string, postIndex: number, limit?: number): void {
    this.moreCommentsLoading = postIndex;
    this.commentsService.getCommentsList({ case_id: this.caseId, parent_id: postId }, limit).pipe(take(1), catchError((err) => {
      this.moreCommentsLoading = -1;
      return of(err);
    })).subscribe((data: CommentListResponse) => {
      this.moreCommentsLoading = -1;
      
      this.loadedComments[postIndex] =
        [
          ...data.items.map((cm: CommentListItem) => {
            for (const [key, value] of Object.entries(this.teamData)) {
              cm.message = cm.message.split(`<@${key}>`).join(`@${value.given_name}`);
            }
            const commentMedia = {
              ...this.feedMediaService.loadAllFeedAttachments(
              cm['media'],
              postId,
              this.caseId,
              'comment',
              cm.comment_id
              ),
            }
            
            this.loadedAttachments[postIndex] = {
              ...this.loadedAttachments[postIndex],
              audios: {
                ...this.loadedAttachments[postIndex].audios,
                list: [...this.loadedAttachments[postIndex].audios.list,  ...this.addMediaIfNotExist(this.loadedAttachments[postIndex].audios.list, commentMedia.audios.list)]
              },
              images: {
                ...this.loadedAttachments[postIndex].images,
                list: [...this.loadedAttachments[postIndex].images.list, ...this.addMediaIfNotExist(this.loadedAttachments[postIndex].images.list, commentMedia.images.list)]
              },
              videos: {
                ...this.loadedAttachments[postIndex].videos,
                list: [...this.loadedAttachments[postIndex].videos.list, ...this.addMediaIfNotExist(this.loadedAttachments[postIndex].videos.list, commentMedia.videos.list)]
              },
              docs: {
                ...this.loadedAttachments[postIndex].docs,
                list: [...this.loadedAttachments[postIndex].docs.list, ...this.addMediaIfNotExist(this.loadedAttachments[postIndex].docs.list, commentMedia.docs.list)]
              },
              files: {
                ...this.loadedAttachments[postIndex].files,
                list: [...this.loadedAttachments[postIndex].files.list, ...this.addMediaIfNotExist(this.loadedAttachments[postIndex].files.list, commentMedia.files.list)]
              },
            }
            return {
              ...cm,
              message: cm.message,
            };
          })
        ]
    });
  }

  private finishPostCreating() {
    this.resetTemplateData();
    this.waitingAttachments = [];
    this.filesToUpload = [];
    this.message = '';
    this.showFeedsList();
    this.blockAddingFeed = false;
    this.newFeedPermissions = this.rolesList.map(role => role.role_id) as string[];
  }

  private resetTemplateData() {
    this.templateData = {
      asset_id: '',
      tag_id: '',
      message: '',
      files: []
    };
  }

  private loadExtesions(): void {
    this.feedsService
      .getExtesions()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(data => (this.supportedExtensions = data));
  }

  private showFeedsList(initialLoading: boolean = false): void {
    const viewAllComments = [...this.feedsList].map(feedPost => {
      return {
        post_id: feedPost.post_id,
        showAllComments: feedPost.showAllComments
      }
    })
    this.feedsService
      .getFeeds(this.caseId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        res => {
          this.loading = false;

          if (res.items && this.componentActive) {
            this.feedsList = res.items
              .reduce((acc: IFeed[], cur: IFeed) => {
                this.commentsToEdit[cur['post_id']] = {};
                this.commentsActiveEdit[cur['post_id']] = {};

                for (const [key, value] of Object.entries(this.teamData)) {
                  cur['message'] = cur['message'].split(`<@${key}>`).join(`@${(value as any).given_name}`);
                }

                cur['replaceMessage'] = cur['message'];
                cur['activeEditing'] = false;
                cur['loading'] = false;
                cur['permissions'] = cur['permissions'] || [];
                cur['replacePermissions'] = cur['permissions'].slice();

                return [...acc, cur];
              }, [])
              .map((feed, index) => {
                viewAllComments.forEach(feedPost => {
                  if (feedPost.post_id === feed.post_id && feedPost.showAllComments) {
                    feed.showAllComments = feedPost.showAllComments;
                  }
                });

                if (initialLoading) {
                  this.loadedComments[index] = [];
                  this.loadedAttachments[index] = this.feedMediaService.loadAllFeedAttachments(
                    feed['media'],
                    feed['post_id'],
                    this.caseId
                  )
                } 

                if (!initialLoading && index === 0) {
                  if (this.loadedComments.length < res.items?.length!) {
                    this.loadedComments.unshift([]);
                  }
                  if (this.loadedAttachments.length) {
                    this.loadedAttachments.unshift(this.feedMediaService.loadAllFeedAttachments(
                      feed['media'],
                      feed['post_id'],
                      this.caseId
                    ));
                  } else {
                    this.loadedAttachments[index] = this.feedMediaService.loadAllFeedAttachments(
                      feed['media'],
                      feed['post_id'],
                      this.caseId
                    )
                  }
                }
                return feed;
              });
          }
        },
        err => {
          this.loading = false;

          if (err.status === 404) {
            this.feedsList = [];
          }
        }
      );
  }

  private loadTemplates(): void {
    this.templatesLoading = true;

    this.feedsService
      .getPostsTemplates(this.caseId)
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.templatesLoading = false))
      )
      .subscribe(({ items }) => {
        this.templates = items.reduce((acc: any, cur: any) => {
          let allTemplateMediaIsReady = true;
          const mediaKeys = cur.media_ct ? Object.keys(cur.media) : [];

          for (const key of mediaKeys) {
            if (cur.media[key].ct) {
              for (const mediaItemKey of Object.keys(cur.media[key].items)) {
                allTemplateMediaIsReady = cur.media[key].items[mediaItemKey].execution_status === MediaStatus.Succeeded;

                if (!allTemplateMediaIsReady) {
                  return acc;
                }
              }
            }
          }

          if (allTemplateMediaIsReady) {
            acc = [
              ...acc,
              {
                asset_id: cur.asset_id,
                message: cur.message,
                tag_id: cur.tag_id,
                files: (() => {
                  const filesList: any = [];

                  if (cur.media_ct) {
                    Object.keys(cur.media).map(key => {
                      const media = cur.media[key];

                      if (media.ct) {
                        for (const mediaItemKey of Object.keys(media.items)) {
                          filesList.push({
                            ...media.items[mediaItemKey],
                            src: media.items[mediaItemKey].display_start
                              ? this.feedMediaService.getFormMediaSrc(
                                  {
                                    ext: media.items[mediaItemKey].display_formats[0],
                                    url_key: media.items[mediaItemKey].display_start,
                                    height: '0',
                                    width: Math.max.apply(null, media.items[mediaItemKey].display_sizes)
                                  },
                                  media.items[mediaItemKey].display_count
                                )
                              : null
                          });
                        }
                      }
                    });
                  }

                  return filesList;
                })()
              }
            ];
          }

          return acc;
        }, []);
      });
  }

  private filterObjectFunction(filterValue: string) {
    const data: { [key: string]: Team } = {};

    for (let key in this.teamData) {
      if (this.teamData.hasOwnProperty(key)) {
        const userName = this.teamData[key].given_name + ' ' + this.teamData[key].family_name;

        if (userName.toLowerCase().includes(filterValue.toLowerCase())) {
          data[key] = this.teamData[key];
        }
      }
    }

    return data;
  }

  private addMediaIfNotExist(existingList: AttachmentForViewer[], comingList: AttachmentForViewer[]): AttachmentForViewer[] {
    return comingList.map(comingMedia => {
      if (existingList.every(existingMedia => comingMedia.media_id !== existingMedia.media_id)) {
        return comingMedia;
      }
      return;
    }).filter(Boolean) as AttachmentForViewer[];
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
