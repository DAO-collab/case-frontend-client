import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { WhoAmI } from '@app/interfaces';

import {
  createLocalTracks,
  LocalTrack,
  LocalVideoTrack,
  RemoteAudioTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteVideoTrack
} from 'twilio-video';

import { TwilioService } from '../../../services/twilio.service';
import { UserService } from '../../../services/user.service';
import { environment } from '../../../../environments/environment';
import { ConvoService } from '../../../services/convo.service';
import { GaussianBlurBackgroundProcessor } from '@twilio/video-processors';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-convo-camera',
  templateUrl: './convo-camera.component.html',
  styleUrls: ['./convo-camera.component.css']
})
export class ConvoCameraComponent implements OnInit, AfterViewInit, OnDestroy {
  // When user made reload of his browser tab or close it, we disconnect user from convo
  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: Event) {
    this.twilioService.roomObj?.disconnect();
  }

  @ViewChild('preview', { static: false }) previewElement?: ElementRef;
  @ViewChild('participants', { static: false }) participants?: ElementRef;

  @Input() permissions = null;
  @Input() convoList: any = null;
  @Input() people: any = null;
  @Input() selectedMediaOptions: any = null;

  @Output() endConvoEvent: EventEmitter<void | boolean> = new EventEmitter<void | boolean>();
  @Output() leaveConvoEvent: EventEmitter<void | string> = new EventEmitter<void | string>();
  @Output() updateInfoEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() kickUserFromConferenceEvent: EventEmitter<void> = new EventEmitter<void>();

  public isVideoMuted: boolean = false;
  public isAudioMuted: boolean = false;
  public isBlur: boolean = false;
  public isUserMenuExpanded: boolean = false;
  public isInitializing: boolean = true;
  public videoViewHeight?: number;
  public userAvatarSrc?: SafeResourceUrl;
  public screenTrack: any;
  public isPreviewOptionSet = false;
  // public zoomedTrackName: string;
  public conferenceLayout: 'galleryView' | 'speakerView' = 'galleryView';
  public numberOfParticipants = 1;
  public isInviteLinkModalOpened = false;
  public inviteLink?: string;
  public showCopiedTipForInviteLink = false;
  public numberOfUsersSeenAtThePage: number = 8;

  private videoTrack?: LocalVideoTrack | null;
  private localTracks: LocalTrack[] = [];
  private participantIdentity = [];
  private dominantSpeakerTrackName?: string | null;
  private unsubscribe$: Subject<void> = new Subject();
  private isLocalParticipantInPreview = true;
  private appendDominantSpeakerWhenRendered = false;
  // variable to know if user disconnected by himself, or he was kicked
  private isUserDisconnected = false;
  private isStartScreenShareAllowed = true;
  private bg?: any;
  private pageNumber: number = 0;

  constructor(
    public twilioService: TwilioService,
    private renderer: Renderer2,
    private userService: UserService,
    private convoService: ConvoService,
    private router: Router,
    private notificationsService: PopInNotificationConnectorService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.userAvatarSrc = this.userService.getAvatarUrl(0);
    this.inviteLink = this.generateInviteLink();
    this.convoService.endConvoSubject.asObservable().subscribe(() => this.endConvo());
    if (this.twilioService.isSupportBlur()) {
      this.bg = new GaussianBlurBackgroundProcessor({
        assetsPath: '/assets/tensor/',
        maskBlurRadius: 3,
        blurFilterRadius: 20
      });
      await this.bg.loadModel();
    }
  }

  ngAfterViewInit() {
    //create localParticipant video
    if (this.previewElement && this.previewElement.nativeElement) {
      this.initializeDevice();
    }

    this.removeLocalParticipantFromPreviewDiv();
    this.convoService.toggleConvoLayoutSubject.asObservable().subscribe(res => {
      if (this.conferenceLayout !== res) {
        this.toggleConferenceLayout();
      }
    });

    //update users in convo
    this.twilioService.updatesSubject.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      if (!this.isPreviewOptionSet) {
        if (this.selectedMediaOptions?.isVideoMuted) {
          this.muteVideo();

          if (this.twilioService.optionsBeforeChangingTab.video === null) {
            this.renderer.setStyle(
              this.previewElement?.nativeElement.querySelector('#local-convo'),
              'visibility',
              'visible'
            );
          }
        }

        if (this.selectedMediaOptions.isAudioMuted) {
          this.muteAudio();
        }

        if (this.selectedMediaOptions.isBlur) {
          this.enableBlur();
        }

        this.isPreviewOptionSet = true;
      }

      this.updateInfoEvent.emit();

      // if admin kick user
      setTimeout(() => {
        if (
          !this.isUserDisconnected &&
          res === 'disconnected' &&
          !this.twilioService.roomObj?.localParticipant?.tracks?.size
        ) {
          this.finalizePreview();
          this.kickUserFromConferenceEvent.emit();
        }
      }, 0);

      this.twilioService.roomObj?.participants?.forEach((participant: any) => {
        let trackName;

        participant.videoTracks.forEach((item: any) => (trackName = item.trackName));

        if (trackName) {
          this.participantIdentity[participant.identity] = trackName;
        }

        this.registerParticipantEvents(participant);
      });

      if (res !== 'disconnected') {
        this.numberOfParticipants = res?.size + 1 || 1;

        // if there are 2 participants, we append one participant in the middle
        if (this.numberOfParticipants === 2 && this.isStartScreenShareAllowed) {
          res.forEach((item: any) => {
            item.videoTracks.forEach((video: any) => (this.dominantSpeakerTrackName = video.trackName));
          });

          // set participant to preview immediately
          if (this.participants?.nativeElement?.getElementsByClassName(this.dominantSpeakerTrackName)[0]) {
            this.appendDominantSpeakerWhenRendered = false;

            if (this.conferenceLayout === 'speakerView') this.appendParticipantToSpeaker(this.dominantSpeakerTrackName!);
          } else {
            // set participant to preview after his block will render
            this.appendDominantSpeakerWhenRendered = this.conferenceLayout === 'speakerView';
          }
        } else {
          this.appendDominantSpeakerWhenRendered = false;
        }

        this.cdr.detectChanges();

        if (this.pageNumber * this.numberOfUsersSeenAtThePage > this.numberOfParticipants - 1) {
          this.turnParticipantsPage();
        }
      }
    });

    // set dominant speaker instead of preview
    this.twilioService.dominantSpeaker
      .asObservable()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(participant => {
        if (participant) {
          if (this.conferenceLayout === 'speakerView') {
            if (this.dominantSpeakerTrackName && this.isStartScreenShareAllowed) {
              this.removeParticipantFromSpeaker(this.dominantSpeakerTrackName);
            }

            participant.videoTracks.forEach(video => (this.dominantSpeakerTrackName = video.trackName));

            if (this.isStartScreenShareAllowed) {
              this.appendParticipantToSpeaker(this.dominantSpeakerTrackName!);
            }
          } else {
            participant.videoTracks.forEach(video => (this.dominantSpeakerTrackName = video.trackName));
          }
        }
        // else {
        // // when there is no dominant speaker, we remove our previous dominants speaker
        // if (this.conferenceLayout === 'speakerView') {
        //   this.removeParticipantFromSpeaker(this.dominantSpeakerTrackName);
        //   this.appendLocalParticipantToPreviewDiv();
        // }
        //
        // this.dominantSpeakerTrackName = null;
        // }
      });
  }

  ngOnDestroy() {
    this.twilioService.optionsBeforeChangingTab.video = !this.isVideoMuted;
    this.twilioService.optionsBeforeChangingTab.audio = !this.isAudioMuted;

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.finalizePreview();
  }

  public chooseSliderMethod(isLeft: boolean, event?: Event): void {
    this.conferenceLayout === 'galleryView' ? this.turnParticipantsPage(isLeft) : this.toggleLayout(isLeft, event);
  }

  toggleLayout(isLeft = true, event: any): void {
    const element = (
        event.target.parentNode
          .getElementsByClassName('convo-participants')[0]
          ?.classList?.contains('convo-participants')
          ? event.target.parentNode.getElementsByClassName('convo-participants')
          : event.target.parentNode.parentNode.getElementsByClassName('convo-participants')
      )[0] as HTMLDivElement,
      style = getComputedStyle(element),
      marginLeft = +style.marginLeft.slice(0, -2),
      width = +style.width.slice(0, -2),
      step = 100;

    if (isLeft && -(marginLeft + step) <= width + marginLeft) {
      this.renderer.setStyle(element, 'margin-left', marginLeft - step + 'px');
    } else if (!isLeft && marginLeft + step <= 0) {
      this.renderer.setStyle(element, 'margin-left', marginLeft + step + 'px');
    }
  }

  public turnParticipantsPage(isLeft: boolean = true): void {
    if (isLeft && this.pageNumber > 0) {
      this.pageNumber--;

      this.checkSliderElements();
    } else if (!isLeft && this.pageNumber * this.numberOfUsersSeenAtThePage + 1 < this.numberOfParticipants - 1) {
      this.pageNumber++;

      this.checkSliderElements();
    }
  }

  private checkSliderElements(): void {
    const result: number = this.pageNumber * this.numberOfUsersSeenAtThePage;
    const visibleElements: number[] = [];

    for (let i = result; i < result + this.numberOfUsersSeenAtThePage; i++) {
      visibleElements.push(i);
    }

    const elements: HTMLElement[] = Array.from(this.participants?.nativeElement.children);

    if (elements.length) {
      elements.forEach((item, index) => {
        visibleElements.includes(index)
          ? item.classList.remove('hide-convo-block')
          : item.classList.add('hide-convo-block');
      });
    }
  }

  private registerParticipantEvents(participant: RemoteParticipant) {
    if (participant) {
      participant.tracks.forEach(publication => this.subscribe(publication, participant));
      participant.on('trackPublished', publication => this.subscribe(publication, participant));
      participant.on('trackUnpublished', publication => {
        if (publication && publication.track) {
          this.detachRemoteTrack(publication.track);
        }
      });
    }
  }

  private subscribe(publication: RemoteTrackPublication, participant: RemoteParticipant) {
    if (publication && publication.on) {
      publication.on('subscribed', (track: RemoteTrack) => this.attachRemoteTrack(track, participant));
      publication.on('unsubscribed', (track: RemoteTrack) => this.detachRemoteTrack(track));
    }
  }

  // show user video when user enable video or show avatar if user disable video
  private attachTrackEnabledDisabledHandlers(track: RemoteTrack, videoTrackName?: string) {
    track.on('enabled', () => {
      if (track.kind === 'video') {
        const parentDiv = this.parentDiv(track.name);

        this.renderer.addClass(parentDiv.getElementsByClassName('convo-participant-avatar')[0], 'display-none');
        this.renderer.removeClass(parentDiv.getElementsByTagName('video')[0], 'display-none');
      } else if (track.kind === 'audio') {
        const parentDiv = this.parentDiv(videoTrackName as string);

        this.renderer.addClass(parentDiv.getElementsByClassName('micro-disabled-image')[0], 'display-none');
      }
    });

    track.on('disabled', () => {
      if (track.kind === 'video') {
        const parentDiv = this.parentDiv(track.name);
        const videoElement: HTMLVideoElement = parentDiv.getElementsByTagName('video')[0];

        this.renderer.addClass(videoElement, 'display-none');
        this.renderer.removeClass(parentDiv.getElementsByClassName('convo-participant-avatar')[0], 'display-none');
      } else if (track.kind === 'audio') {
        const parentDiv = this.parentDiv(videoTrackName as string);

        this.renderer.removeClass(parentDiv.getElementsByClassName('micro-disabled-image')[0], 'display-none');
      }
    });
  }

  // return parent div for function above
  private parentDiv(trackName: string): HTMLDivElement {
    const participantDiv: HTMLDivElement = this.participants?.nativeElement.getElementsByClassName(trackName)[0];
    const previewDiv: HTMLDivElement = this.previewElement?.nativeElement.getElementsByClassName(trackName)[0];

    return participantDiv || previewDiv;
  }

  //attach  participants video
  private async attachRemoteTrack(track: RemoteTrack, participant: RemoteParticipant) {
    if (this.isAttachable(track)) {
      let videoTrackName: string;

      track.name === 'screen-share'
        ? (videoTrackName = track.name)
        : participant.videoTracks.forEach(publication => {
            if (publication.trackName !== 'screen-share') {
              videoTrackName = publication.trackName;
            }
          });

      if (!this.parentDiv(videoTrackName!)) {
        const div = document.createElement('div');

        // append parent div
        this.renderer.setAttribute(div, 'class', videoTrackName!);
        this.renderer.appendChild(this.participants?.nativeElement, div);
        this.renderer.addClass(
          this.participants?.nativeElement.getElementsByClassName(videoTrackName!)[0],
          'convo-participant-div'
        );
      }

      if (track.kind === 'video') {
        const img = document.createElement('img');
        const userAvatar: HTMLImageElement = document.createElement('img');
        if (this.twilioService.isSupportBlur()) track?.addProcessor(this.bg);
        const video = track.attach();
        const userId: string = Object.keys(this.participantIdentity).filter(key => {
          return this.participantIdentity[key as any] === track.name;
        })[0];

        img.src = 'images/convo-participant-settings-white.svg';
        userAvatar.src = this.getConvoUserAvatar(userId);

        // append tree dots img
        this.renderer.setAttribute(img, 'class', 'convo-paricipant-three-dots-img');
        this.renderer.appendChild(this.participants?.nativeElement.getElementsByClassName(track.name)[0], img);

        // append user avatar
        this.renderer.setAttribute(userAvatar, 'class', 'convo-participant-avatar');
        this.renderer.appendChild(this.participants?.nativeElement.getElementsByClassName(track.name)[0], userAvatar);

        // append user video
        this.renderer.data['id'] = track.sid;
        this.renderer.setStyle(video, 'width', '100%');
        this.renderer.setStyle(video, 'height', '100px');
        this.renderer.setAttribute(video, 'class', 'convo-participant');
        this.renderer.setAttribute(video, 'id', track.name + '-video');
        this.renderer.appendChild(this.participants?.nativeElement.getElementsByClassName(track.name)[0], video);

        // show user video when video track enabled or avatar if disabled
        track.isEnabled
          ? this.renderer.addClass(userAvatar, 'display-none')
          : this.renderer.addClass(video, 'display-none');

        // hide remove participant option, if user have no permission
        if (!this.permissions?.['moderate_others']) {
          this.renderer.setAttribute(img, 'class', 'display-none');
        } else {
          // show remove participant from call option
          this.renderer.listen(img, 'click', event => {
            const elements = this.participants?.nativeElement.getElementsByClassName('remove-participant-from-call');

            if (elements.length) {
              for (let i = 0; i < elements.length; i++) {
                this.renderer?.removeChild(this.participants?.nativeElement, elements[i]);
              }
            } else {
              const removeFromCallDiv = document.createElement('div');

              removeFromCallDiv.innerText = 'Remove from the call';

              this.renderer.setAttribute(removeFromCallDiv, 'class', 'remove-participant-from-call');
              this.renderer.appendChild(event.target?.parentNode, removeFromCallDiv);

              // detach remove participant from call option & send remove request
              this.renderer.listen(removeFromCallDiv, 'click', event => {
                this.leaveConvoEvent.emit(userId);
                this.renderer.removeChild(event.target?.parentNode, event.target);
              });
            }
          });
        }

        // set participant to preview
        if (this.conferenceLayout === 'speakerView' && this.appendDominantSpeakerWhenRendered) {
          this.appendDominantSpeakerWhenRendered = false;

          this.appendParticipantToSpeaker(this.dominantSpeakerTrackName!);

          if (this.isLocalParticipantInPreview) {
            this.removeLocalParticipantFromPreviewDiv();
          }
        } else {
          this.appendDominantSpeakerWhenRendered = false;
        }

        // disable screen sharing
        if (track.name === 'screen-share') {
          this.isStartScreenShareAllowed = false;
          this.renderer.addClass(
            this.participants?.nativeElement.getElementsByClassName(track.name)[0],
            'convo-screen-share-div'
          );

          // is screen sharing auto change layout to speaker
          if (this.conferenceLayout === 'galleryView') {
            this.toggleConferenceLayout();
          } else if (this.conferenceLayout === 'speakerView') {
            this.dominantSpeakerTrackName
              ? this.removeParticipantFromSpeaker(this.dominantSpeakerTrackName)
              : this.removeLocalParticipantFromPreviewDiv();

            this.appendParticipantToSpeaker(track.name);
          }
        } else {
          // do not attach handlers for screen-share
          this.attachTrackEnabledDisabledHandlers(track);
        }

        // this.zoomVideo(video, track);
      } else if (track.kind === 'audio') {
        const microDisabledImage = document.createElement('img');
        const participantNameWrapper = document.createElement('div');
        const participantName = document.createElement('div');
        const userId: string = Object.keys(this.participantIdentity).filter(key => {
          return this.participantIdentity[key as any] === videoTrackName;
        })[0];
        const userInfo: WhoAmI | null = this.getConvoUserInfo(userId);

        microDisabledImage.src = 'images/convo-participant-audio-disabled.svg';
        participantName.innerText = userInfo?.given_name + ' ' + userInfo?.family_name;

        // show disabled icon when audio track disabled or hide it
        if (track.isEnabled) {
          this.renderer.addClass(microDisabledImage, 'display-none');
        }

        // append name wrapper
        this.renderer.setAttribute(participantNameWrapper, 'class', 'convo-participant-name');
        this.renderer.appendChild(
          this.participants?.nativeElement.getElementsByClassName(videoTrackName!)[0],
          participantNameWrapper
        );

        // append name icon
        this.renderer.addClass(microDisabledImage, 'micro-disabled-image');
        this.renderer.appendChild(participantNameWrapper, microDisabledImage);

        // append username
        this.renderer.appendChild(participantNameWrapper, participantName);

        this.attachTrackEnabledDisabledHandlers(track, videoTrackName!);
      }
    }
  }

  //detach participant video
  private detachRemoteTrack(track: RemoteTrack) {
    if (this.isDetachable(track)) {
      // if dominant speaker left convo
      if (this.dominantSpeakerTrackName === track.name) {
        this.previewElement?.nativeElement?.getElementsByClassName(track.name)[0]?.remove();
        this.dominantSpeakerTrackName = null;

        if (this.conferenceLayout === 'speakerView') {
          this.appendLocalParticipantToPreviewDiv();
        }
        // if user turn off his screen share
      } else if (track.name === 'screen-share') {
        this.previewElement?.nativeElement?.getElementsByClassName(track.name)[0]?.remove();
        this.isStartScreenShareAllowed = true;

        if (this.dominantSpeakerTrackName && this.conferenceLayout === 'speakerView') {
          this.appendParticipantToSpeaker(this.dominantSpeakerTrackName);
        } else if (this.conferenceLayout === 'speakerView') {
          this.appendLocalParticipantToPreviewDiv();
        }
      } else {
        this.participants?.nativeElement?.getElementsByClassName(track.name)[0]?.remove();
      }

      track.detach().forEach(el => el.remove());
    }
  }

  //prevent attach errors
  private isAttachable(track: RemoteTrack): track is RemoteAudioTrack | RemoteVideoTrack {
    return (
      !!track && ((track as RemoteAudioTrack).attach !== undefined || (track as RemoteVideoTrack).attach !== undefined)
    );
  }

  //prevent detach errors
  private isDetachable(track: RemoteTrack): track is RemoteAudioTrack | RemoteVideoTrack {
    return (
      !!track && ((track as RemoteAudioTrack).detach !== undefined || (track as RemoteVideoTrack).detach !== undefined)
    );
  }

  //close video
  public finalizePreview() {
    try {
      if (this.videoTrack) {
        this.videoTrack.stop();
        this.videoTrack.detach().forEach(element => element.remove());
      }

      this.videoTrack = null;
    } catch (e) {
      console.error(e);
    }
  }

  //start localParticipant video
  private async initializeDevice() {
    try {
      this.finalizePreview();

      this.isInitializing = true;
      this.localTracks = await this.initializeTracks();
      this.videoTrack = this.localTracks.find(t => t.kind === 'video') as LocalVideoTrack;
      const videoElement = this.videoTrack?.attach();

      if (videoElement) {
        this.renderer.setStyle(videoElement, 'height', '100%');
        this.renderer.setStyle(videoElement, 'max-height', '100vh');
        this.renderer.setStyle(videoElement, 'width', '100%');
        this.renderer.setAttribute(videoElement, 'id', 'local-convo');
        this.renderer.setAttribute(videoElement, 'class', 'local-convo-video');
        this.renderer.appendChild(
          this.previewElement?.nativeElement.querySelector('.local-participant-div'),
          videoElement
        );
        this.videoViewHeight = this.previewElement?.nativeElement.offsetHeight;
      }
    } finally {
      if (this.selectedMediaOptions.isBlur && this.twilioService.isSupportBlur()) {
        const bg = new GaussianBlurBackgroundProcessor({
          assetsPath: '/assets/tensor/',
          maskBlurRadius: 3,
          blurFilterRadius: 20
        });
        await bg.loadModel();
        this.videoTrack?.addProcessor(bg);
      }
      if (
        this.selectedMediaOptions.isVideoMuted &&
        this.twilioService.optionsBeforeChangingTab.video === null &&
        this.videoTrack?.attach()
      ) {
        this.renderer.setStyle(this.previewElement?.nativeElement.querySelector('#local-convo'), 'visibility', 'hidden');
      }

      this.isInitializing = false;

      if (
        this.twilioService.optionsBeforeChangingTab?.video !== null ||
        this.twilioService.optionsBeforeChangingTab?.audio !== null
      ) {
        this.setOptionsBack();
      }
    }
  }

  // when user go to other rout and then return to convo we set enable/disable audio and video options back
  private setOptionsBack() {
    if (this.twilioService.optionsBeforeChangingTab?.audio !== null) {
      this.isAudioMuted = !this.twilioService.optionsBeforeChangingTab.audio;
      this.isPreviewOptionSet = true;
    }

    if (this.twilioService.optionsBeforeChangingTab?.video !== null) {
      this.isVideoMuted = !this.twilioService.optionsBeforeChangingTab.video;
      this.isPreviewOptionSet = true;

      if (this.isVideoMuted) {
        this.videoViewHeight = this.previewElement?.nativeElement.querySelector('#local-convo').offsetHeight;
        this.renderer.setStyle(this.previewElement?.nativeElement.querySelector('#local-convo'), 'display', 'none');
      }

      setTimeout(() => {
        this.twilioService.updatesSubject.next();
      }, 0);
    }
  }

  //show localParticipant video for himself
  private initializeTracks() {
    return createLocalTracks({ audio: false, video: !this.isVideoMuted });
  }

  //mute or unmute localParticipant audio
  public muteAudio() {
    if (!this.isAudioMuted) {
      this.twilioService.roomObj?.localParticipant.audioTracks.forEach((publication: any) => {
        publication.track.disable();
      });
    } else {
      this.twilioService.roomObj?.localParticipant.audioTracks.forEach((publication: any) => {
        publication.track.enable();
      });
    }

    this.isAudioMuted = !this.isAudioMuted;
  }

  //mute or unmute localParticipant video
  public muteVideo() {
    const element = this.previewElement?.nativeElement.querySelector('#local-convo');

    if (!this.isVideoMuted) {
      // this.videoViewHeight = element.offsetHeight || this.previewElement.nativeElement.offsetHeight;
      this.twilioService.roomObj?.localParticipant.videoTracks.forEach((publication: any) => {
        if (publication.trackName !== 'screen-share') {
          publication.track.disable();
        }

        // publication.track.stop();
        // publication.unpublish();
      });
      this.renderer.setStyle(element, 'display', 'none');

      this.isVideoMuted = true;
    } else {
      // await createLocalVideoTrack().then(localVideoTrack => {
      //   this.twilioService.roomObj?.localParticipant.publishTrack(localVideoTrack);
      // })

      this.twilioService.roomObj?.localParticipant.videoTracks.forEach((publication: any) => publication.track.enable());
      this.renderer.setStyle(element, 'display', 'block');

      this.isVideoMuted = false;
    }
  }
  public enableBlur() {
    if (!this.isBlur) {
      this.isBlur = true;
    } else {
      this.isBlur = false;
    }
    this.initializeDevice();
  }

  public endConvo() {
    this.isUserDisconnected = true;
    //disable user video
    this.twilioService.roomObj?.localParticipant.videoTracks.forEach((publication: any) => {
      publication.track.stop();
      publication.unpublish();
    });

    this.finalizePreview();

    this.endConvoEvent.emit(true);
  }

  public leaveConvo() {
    this.isUserDisconnected = true;

    this.finalizePreview();
    this.leaveConvoEvent.emit();
  }

  // expand settings on 3 dots button
  public expandMenuSettings() {
    this.isUserMenuExpanded = !this.isUserMenuExpanded;
  }

  // get current participant info
  public getConvoUserInfo(userId: string): WhoAmI | null {
    const participant = this.people?.filter((user: any) => user.user_id === userId);

    if (participant) {
      return participant[0];
    } else {
      return null;
    }
  }

  // get participant avatar
  private getConvoUserAvatar(userId:  string) {
    return this.userService.getAvatarUrl(0, this.getConvoUserInfo(userId));
  }

  public shareScreen() {
    // Allow screen share only for one user in convo
    if (!this.isStartScreenShareAllowed) {
      return;
    }

    const mediaDevices = navigator.mediaDevices;
    // event.preventDefault();
    if (!this.screenTrack) {
      mediaDevices
        .getDisplayMedia()
        .then((stream) => {
          this.screenTrack = new LocalVideoTrack(stream.getTracks()[0], { name: 'screen-share' });
          this.twilioService.roomObj.localParticipant.publishTrack(this.screenTrack);
          this.screenTrack.mediaStreamTrack.onended = () => {
            this.shareScreen();
          };
        })
        .catch(() => {
          alert('Could not share the screen');
        });
    } else {
      this.twilioService.roomObj.localParticipant.unpublishTrack(this.screenTrack);
      this.screenTrack.stop();
      this.screenTrack = null;
    }
  }

  // remove participant view from dominant speaker
  private removeParticipantFromSpeaker(childSelector: any): void {
    const parentDiv: HTMLDivElement = this.previewElement?.nativeElement.getElementsByClassName(childSelector)[0];

    this.renderer.setStyle(parentDiv, 'height', '100px');
    this.renderer.removeChild(this.previewElement?.nativeElement, parentDiv);
    this.renderer.appendChild(this.participants?.nativeElement, parentDiv);
  }

  // add participant view to dominant speaker
  private appendParticipantToSpeaker(childSelector: string): void {
    const parentDiv: HTMLDivElement = this.participants?.nativeElement.getElementsByClassName(childSelector)[0];

    // prevent resize if there are participants blocks
    this.renderer.setStyle(parentDiv, 'height', this.videoViewHeight! - 110 + 'px');
    this.renderer.removeChild(this.participants?.nativeElement, parentDiv);
    this.renderer.appendChild(this.previewElement?.nativeElement, parentDiv);

    if (this.isLocalParticipantInPreview) {
      this.removeLocalParticipantFromPreviewDiv();
    }
  }

  // toggle galleryView and galleryView
  public toggleConferenceLayout(): void {
    if (this.conferenceLayout === 'galleryView') {
      this.appendLocalParticipantToPreviewDiv();

      if (!this.isStartScreenShareAllowed) {
        this.appendParticipantToSpeaker('convo-screen-share-div');
      } else {
        if (
          this.dominantSpeakerTrackName &&
          this.participants?.nativeElement.getElementsByClassName(this.dominantSpeakerTrackName)[0]
        ) {
          this.appendParticipantToSpeaker(this.dominantSpeakerTrackName);
        }
      }

      // if (this.dominantSpeakerTrackName
      //   && this.participants.nativeElement.getElementsByClassName(this.dominantSpeakerTrackName)[0]) {
      //   this.appendParticipantToSpeaker(this.dominantSpeakerTrackName);
      // }

      this.conferenceLayout = 'speakerView';
    } else {
      this.removeLocalParticipantFromPreviewDiv();

      if (!this.isStartScreenShareAllowed) {
        this.removeParticipantFromSpeaker('convo-screen-share-div');
      } else {
        if (
          this.dominantSpeakerTrackName &&
          this.previewElement?.nativeElement.getElementsByClassName(this.dominantSpeakerTrackName)[0]
        ) {
          this.removeParticipantFromSpeaker(this.dominantSpeakerTrackName);
        }
      }

      // if (this.dominantSpeakerTrackName
      //   && this.previewElement.nativeElement.getElementsByClassName(this.dominantSpeakerTrackName)[0]) {
      //   this.removeParticipantFromSpeaker(this.dominantSpeakerTrackName);
      // }

      this.renderer.setStyle(this.participants?.nativeElement, 'margin-left', '0');
      this.conferenceLayout = 'galleryView';
    }
  }

  // append local participant to preview
  private appendLocalParticipantToPreviewDiv() {
    const parentDiv: HTMLDivElement = this.participants?.nativeElement.querySelector('.local-participant-div');

    this.isLocalParticipantInPreview = true;

    this.renderer.removeChild(this.participants?.nativeElement, parentDiv);
    this.renderer.appendChild(this.previewElement?.nativeElement, parentDiv);
  }

  // append local participant to participants
  private removeLocalParticipantFromPreviewDiv() {
    const parentDiv: HTMLDivElement = this.previewElement?.nativeElement.querySelector('.local-participant-div');

    this.isLocalParticipantInPreview = false;

    this.renderer.removeChild(this.previewElement?.nativeElement, parentDiv);
    this.renderer.appendChild(this.participants?.nativeElement, parentDiv);
  }

  public copyText(text: string): void {
    navigator.clipboard.writeText(text).then();
    const notification: Notification = this.notificationsService.addNotification({
      title: `Copied`
    });
    this.notificationsService.ok(notification, '');
  }

  public toggleInviteLinkModal() {
    this.isInviteLinkModalOpened = !this.isInviteLinkModalOpened;
    this.showCopiedTipForInviteLink = false;
  }

  // show simplified link for desktop
  public formatInviteLinkForViewDesktop(link: string) {
    const firstLinkPart = link.slice(0, 30);
    const lastLinkPart = link.slice(-30);
    return firstLinkPart + '...' + lastLinkPart;
  }

  // for mobile
  public formatInviteLinkForViewMobile(link: string) {
    const firstLinkPart = link.slice(0, 20);
    const lastLinkPart = link.slice(-20);
    return firstLinkPart + '...' + lastLinkPart;
  }

  // generate invite link for invite link modal
  private generateInviteLink(): string {
    const startIndex = location.href.indexOf('ca-');
    const endIndex = location.href.indexOf('.');
    const hostId = location.href.slice(startIndex, endIndex);

    return (
      environment.APP_CLIENT_URL.replace('*', hostId) +
      this.router.url +
      '?case=' +
      this.convoList?.case_id +
      '&id=convo' +
      '&action=view'
    );
  }
}
