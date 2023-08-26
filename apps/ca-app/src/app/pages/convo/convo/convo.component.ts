import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import { SafeResourceUrl, Title } from '@angular/platform-browser';

import { map, takeUntil, tap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { CaseStatus } from '@app/types';
import { RoleNames, WhoAmI } from '@app/interfaces';

import { createLocalTracks, LocalAudioTrack, LocalTrack, LocalVideoTrack } from 'twilio-video';

import { CasesService } from '../../../services/cases.service';
import { UserService } from '../../../services/user.service';
import { ConvoService } from '../../../services/convo.service';
import { TwilioService } from '../../../services/twilio.service';
import { HostService } from '../../../services/host.service';
import { GaussianBlurBackgroundProcessor } from '@twilio/video-processors';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { RolesService } from '../../../services/roles.service';
import { IConvoOption } from '../interfaces/convo-option.interface';

@Component({
  selector: 'app-convo',
  templateUrl: './convo.component.html',
  styleUrls: ['./convo.component.css']
})
export class ConvoComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('preview', { static: false }) set content(content: ElementRef) {
    // initially setter gets called with undefined
    if (content && !this.isPreviewSet) {
      this.previewElement = content;

      if (this.previewElement) {
        this.isPreviewSet = true;
      }

      this.initializeSubject.next();
    }
  }

  @Output() afterChange = new EventEmitter<boolean>();
  @Output() afterSave = new EventEmitter();

  // When user made reload of his browser tab or close it, we disconnect user from convo
  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: Event) {
    this.twilioService.roomObj?.disconnect();
  }

  public loading = true;
  public convo_status = false;
  public permissions: any = {};
  public caseId: string = '';
  public convoList: any = [];
  public userAvatarSrc: SafeResourceUrl = '';
  public room_id!: string;
  public participantsCount = 0;
  public isUserJoin = false;
  public isConvoEnded = false;
  public convo_option: IConvoOption = {
    audio_only: false,
    recorded: false,
    blur: true
  };
  public token = '';
  public people?: any[];
  public isInitializing: boolean = true;
  public selectedMediaOptions = {
    isVideoMuted: false,
    isAudioMuted: false,
    isBlur: true
  };
  public videoViewHeight?: number;
  public isViewChanged = false;
  public isNotifyTheHostMenuExpanded = false;
  public botsRole = 'role::bots';
  public errorTypeWhenDeviceMissing: ('video' | 'audio')[] = [];
  public rolesList: RoleNames[] = [];
  public newPermissions: string[] = [];
  public getRoles$: Observable<RoleNames[]> = this.rolesService.rolesGetSub.pipe(
    tap((data: RoleNames[]) => {
      this.rolesList = data;
      this.newPermissions = data.filter(v => v.role_id !== 'role::bots').map(role => role.role_id);
      this.rolesList = data.filter(v => v.role_id !== 'role::bots');
    })
  );
  public validationErrors: string[] = [];
  public currentCaseStatus$: Observable<CaseStatus | undefined>;

  private unsubscribe$: Subject<void> = new Subject();
  private initializeSubject: Subject<any> = new Subject();
  private videoTrack?: LocalVideoTrack | null;
  private localTracks: LocalTrack[] = [];
  private previewElement?: ElementRef;
  private isPreviewSet = false;
  private cameras?: any;
  private microphones?: any;
  constructor(
    public twilioService: TwilioService,
    public userService: UserService,
    private renderer: Renderer2,
    private convoService: ConvoService,
    private notificationsService: PopInNotificationConnectorService,
    private casesService: CasesService,
    private titleService: Title,
    private hostService: HostService,
    private rolesService: RolesService
  ) {
    this.currentCaseStatus$ = this.casesService.activeCaseObs$.pipe(map(data => data?.status));
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Convo`);
    this.userAvatarSrc = this.userService.getAvatarUrl(0);

    this.casesService.getCaseId.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      this.caseId = res['case_id'];

      this.userService.getCasePermissionsData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
        data.role.permissions.convos.map((v) => {
          this.permissions[v] = v;
        });

        this.loadConvoInfo();
      });
    });
    this.userService.getTeamData.subscribe(data => (this.people = data?.items));

    navigator.mediaDevices.enumerateDevices().then(devices => {
      this.microphones = devices.filter(d => d.kind === 'audioinput');
      this.cameras = devices.filter(d => d.kind === 'videoinput');
    });
    if (!this.twilioService.isSupportBlur()) {
      this.selectedMediaOptions.isBlur = false;
    }
    if (this.twilioService.roomObj) {
      this.isUserJoin = true;
    }
  }

  ngAfterViewInit() {
    this.initializeSubject.subscribe(() => {
      //create preview video
      setTimeout(() => {
        if (this.previewElement && this.previewElement.nativeElement) {
          this.initializeDevice();
        }
      }, 0);
    });
  }

  ngOnDestroy() {
    this.finalizePreview();
    clearInterval(this.convoService.updatePageInterval);
    this.convoService.updatePageInterval = null;

    this.unsubscribe$.next();
    this.unsubscribe$.unsubscribe();
  }

  loadConvoInfo() {
    this.convoService.getConvos(this.caseId).subscribe(
      (res) => {
        this.convoList = res;
        this.participantsCount = Object.keys(res.participants).length ?? 0;
        this.room_id = res.room_id;
        this.loading = false;
        this.convo_option.recording_permissions =
          this.convoList.recording_permissions || this.convo_option.recording_permissions;

        if (!this.convoService.updatePageInterval) {
          this.convo_option.audio_only = this.convoList.audio_only || this.convo_option.audio_only;
        }

        if (this.convoList['status'] == 'in-progress') {
          this.convo_status = true;
        } else {
          this.isConvoEnded = true;
          this.isUserJoin = false;
          this.convo_status = false;

          if (!this.convoService.updatePageInterval) {
            this.selectedMediaOptions = {
              isVideoMuted: false,
              isAudioMuted: false,
              isBlur: true
            };
          }

          // this.isPreviewSet = false;
          this.twilioService.optionsBeforeChangingTab.video = null;
          this.twilioService.optionsBeforeChangingTab.audio = null;
          this.twilioService.optionsBeforeChangingTab.blur = null;
        }

        this.convoService.convoOptions.isAudioOnly = this.convo_option.audio_only;
        this.convoService.convoOptions.status =
          this.convo_status &&
          this.permissions &&
          !this.loading &&
          this.permissions['manage_own'] &&
          this.isUserJoin &&
          !this.isConvoEnded;

        this.setUpdatePageInterval();
      },
      err => {
        this.loading = false;
      }
    );
  }

  createConvo() {
    this.isViewChanged = true;
  }

  connect() {
    if (!this.convo_status) {
      const notification: Notification = this.notificationsService.addNotification({
        title: `Saving Convo`
      });

      if (this.convo_option.recorded) {
        this.convo_option.recording_permissions = this.newPermissions;
      }

      this.convoService.createConvo(this.caseId, this.convo_option).subscribe(
        () => {
          // this.room_id = res.room_id;
          // this.afterChangeEmit();
          this.notificationsService.ok(notification, 'Convo Created');

          this.convoService.getConvos(this.caseId).subscribe(
            (res) => {
              this.convoList = res;
              this.participantsCount = Object.keys(res.participants).length ?? 0;
              this.convo_option.audio_only = this.convoList.audio_only || this.convo_option.audio_only;
              this.convo_option.recording_permissions =
                this.convoList.recording_permissions || this.convo_option.recording_permissions;
              this.convo_option.blur = this.convoList.blur || this.convo_option.blur;
              this.room_id = res.room_id;
              this.loading = false;

              if (this.convoList['status'] == 'in-progress') {
                this.convo_status = true;
              } else {
                this.isConvoEnded = true;
                this.isUserJoin = false;
                this.convo_status = false;
                this.selectedMediaOptions = {
                  isVideoMuted: false,
                  isAudioMuted: false,
                  isBlur: true
                };
                // this.isPreviewSet = false;
              }

              this.convoService.joinConvo(this.caseId, this.room_id).subscribe(
                (res) => {
                  this.token = res.token;
                  this.isUserJoin = true;
                  this.isConvoEnded = false;

                  this.finalizePreview();
                  if (!this.convo_option.audio_only) {
                    if (!this.convo_option.blur)
                      this.twilioService.connectToRoom(this.token, { dominantSpeaker: true });
                    else this.twilioService.connectToRoom(this.token, { dominantSpeaker: true, blur: true });
                  } else {
                    this.twilioService.connectToRoom(this.token, { video: false, audio: true });
                  }

                  this.loadConvoInfo();
                },
                err => {}
              );
            },
            err => {
              this.loading = false;
            }
          );
        },
        err => {
          this.notificationsService.failed(notification, err.message);
        }
      );
    } else {
      this.convoService.joinConvo(this.caseId, this.room_id).subscribe(
        (res) => {
          this.token = res.token;
          this.isUserJoin = true;
          this.isConvoEnded = false;

          this.finalizePreview();

          if (!this.convo_option.audio_only) {
            if (!this.convo_option.blur) {
              this.twilioService.connectToRoom(this.token, {
                dominantSpeaker: true
                // name: this.room_id,
                // audio: true,
                // video: { height: 720, frameRate: 24, width: 1280 },
                // bandwidthProfile: {
                //   video: {
                //     mode: 'collaboration',
                //     renderDimensions: {
                //       high: { height: 1080, width: 1980 },
                //       standard: { height: 720, width: 1280 },
                //       low: { height: 176, width: 144 }
                //     }
                //   }
                // }
              });
            } else {
              this.twilioService.connectToRoom(this.token, {
                dominantSpeaker: true,
                blur: true
              });
            }
          } else {
            this.twilioService.connectToRoom(this.token, {
              // name: this.room_id,
              audio: true,
              video: false
            });
          }

          this.loadConvoInfo();
        },
        err => {}
      );
    }
  }

  selectAudio() {
    this.convo_option.audio_only = true;
  }

  selectVideo() {
    this.convo_option.audio_only = false;
  }

  selectRecording(event: any) {
    this.convo_option.recorded = !this.convo_option.recorded;
  }

  endConvo() {
    const notification: Notification = this.notificationsService.addNotification({
      title: `Ending Convo`
    });

    this.convoService.deleteConvo(this.caseId).subscribe(
      () => {
        this.isConvoEnded = true;
        this.isUserJoin = false;
        this.convo_status = false;
        this.isViewChanged = false;
        this.isPreviewSet = false;
        this.selectedMediaOptions.isAudioMuted = false;
        this.selectedMediaOptions.isVideoMuted = false;
        this.selectedMediaOptions.isBlur = true;

        this.loadConvoInfo();
        this.notificationsService.ok(notification, 'Convo Ended');
      },
      err => {
        this.notificationsService.failed(notification, err.message);
      }
    );
  }

  leaveConvo(id?: any) {
    const userId = id || this.userService.userData?.user_id;

    this.convoService.leaveConvo(this.caseId, this.room_id, userId).subscribe(() => {
      if (!id) {
        this.isUserJoin = false;
        this.selectedMediaOptions.isAudioMuted = false;
        this.selectedMediaOptions.isVideoMuted = false;
        this.selectedMediaOptions.isBlur = true;
        this.isPreviewSet = false;
      }

      this.loadConvoInfo();
    });
  }

  // when the admin kick user from conference, we change user view
  kickUserFromConference() {
    this.selectedMediaOptions.isAudioMuted = false;
    this.selectedMediaOptions.isVideoMuted = false;
    this.selectedMediaOptions.isBlur = true;
    this.isPreviewSet = false;
    this.isUserJoin = false;

    this.loadConvoInfo();
  }

  public expandNotifyTheHostDropdown() {
    this.isNotifyTheHostMenuExpanded = !this.isNotifyTheHostMenuExpanded;
  }

  public notifyTheHost(user: any) {
    const userId = { user_id: user.user_id };
    const notification: Notification = this.notificationsService.addNotification({ title: `Notifying Host` });

    this.isNotifyTheHostMenuExpanded = false;

    this.convoService.notifyTheHost(this.caseId, userId as any).subscribe(
      () => {
        this.notificationsService.ok(notification, 'Host Notified');
      },
      err => {
        this.notificationsService.failed(notification, 'Notifying Failed');
      }
    );
  }

  //get current participant info
  public getConvoUserInfo(index: number): WhoAmI | null {
    const participants = Object.keys(this.convoList.participants)?.filter(
      item => item !== this.userService.userData?.user_id
    );
    const participant = this.people?.filter(user => user.user_id === participants[index]);
    if (participant) {
      return participant[0];
    } else {
      return null;
    }
  }

  //get current participant avatarh
  public getConvoUserAvatar(index: number) {
    return this.userService.getAvatarUrl(64, this.getConvoUserInfo(index));
  }

  public muteAudio() {
    this.selectedMediaOptions.isAudioMuted = !this.selectedMediaOptions.isAudioMuted;
  }

  public muteVideo() {
    const element = this.previewElement?.nativeElement.querySelectorAll('.convo-preview-video-wrapper')[0];

    if (!this.selectedMediaOptions.isVideoMuted) {
      this.videoViewHeight = this.previewElement?.nativeElement.offsetHeight;

      this.renderer.setStyle(element, 'display', 'none');
    } else {
      this.renderer.setStyle(element, 'display', 'flex');
    }

    this.selectedMediaOptions.isVideoMuted = !this.selectedMediaOptions.isVideoMuted;
  }
  public isSupportBlur() {
    return this.twilioService.isSupportBlur();
  }
  public enableBlur() {
    this.selectedMediaOptions.isBlur = !this.selectedMediaOptions.isBlur;
    this.convo_option.blur = this.selectedMediaOptions.isBlur;
    this.initializeDevice();
  }

  public dismissPressed() {
    window.location.reload();
  }

  //start localParticipant video
  private async initializeDevice() {
    navigator.mediaDevices.getUserMedia({video: true})
      .then( async devices => {
    try {
      this.finalizePreview();

      this.isInitializing = true;
          try {
            this.localTracks = await this.initializeTracks();
          } catch (e) {
            console.log(e);
          }
          this.videoTrack = this.localTracks.find(t => t.kind === 'video') as LocalVideoTrack;
    
          const videoElement = this.videoTrack?.attach();
    
          this.renderer.setStyle(videoElement, 'height', '100%');
          this.renderer.setStyle(videoElement, 'width', '100%');
          this.renderer.setStyle(videoElement, 'border-radius', '5px');
          this.renderer.setAttribute(videoElement, 'id', 'local-preview-convo');
          this.renderer.appendChild(this.previewElement?.nativeElement.getElementsByClassName('convo-preview-video-wrapper')[0], videoElement);
        
      

    } finally {
      if (!this.convo_option.audio_only && this.selectedMediaOptions.isBlur && this.twilioService.isSupportBlur()) {
        const bg = new GaussianBlurBackgroundProcessor({ assetsPath: "/assets/tensor/", maskBlurRadius: 3, blurFilterRadius: 20 });
        await bg.loadModel();
        this.videoTrack?.addProcessor(bg);
      }
      this.isInitializing = false;

      this.renderer.setAttribute(this.previewElement?.nativeElement
        .getElementsByClassName('convo-preview-video-wrapper')[0], 'id', 'convo-preview-video-wrapper');

      if (this.convo_option.audio_only) {
        this.muteVideo();
        this.finalizePreview();
      }

      this.isMicroAndWebCamAvailable(this.convo_option.audio_only);
    }
  })
  .catch(error => console.log(error));
  }

  //show localParticipant video for himself
  private initializeTracks() {
    return createLocalTracks({
      audio: true,
      video: {
        width: 1280,
        height: 720
      }
    });
  }

  //close video
  private finalizePreview() {
    try {
      if (this.videoTrack) {
        this.videoTrack.stop();
        (this.localTracks.find(t => t.kind === 'audio') as LocalAudioTrack)?.stop();
        this.videoTrack.detach().forEach(element => element.remove());
      }

      this.videoTrack = null;
    } catch (e) {
      console.error(e);
    }
  }

  // Update page every few seconds to see if convo started or not
  private setUpdatePageInterval() {
    if (!this.isUserJoin && !this.convoService.updatePageInterval && this.permissions && this.permissions['read_all']) {
      this.convoService.updatePageInterval = setInterval(() => {
        this.loadConvoInfo();
      }, 10000);
    }
  }

  // check is webcam and micro are available
  private isMicroAndWebCamAvailable(isAudioConference: any) {
    if (!isAudioConference) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(stream => {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
        })
        .catch(error => {
          console.log(error);
          this.errorTypeWhenDeviceMissing.push('video');
        });
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(stream => {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      })
      .catch(error => {
        console.log(error);
        this.errorTypeWhenDeviceMissing.push('audio');
      });
  }

  // Detect changes on event
  // private afterChangeEmit(): void {
  //   this.afterChange.emit();
  //   this.afterSave.emit();
  // }
}
