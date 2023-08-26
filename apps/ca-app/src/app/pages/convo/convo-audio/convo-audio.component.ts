import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { WhoAmI } from '@app/interfaces';

import {
  RemoteAudioTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteVideoTrack
} from 'twilio-video';

import { TwilioService } from '../../../services/twilio.service';
import { UserService } from '../../../services/user.service';
import { ConvoService } from '../../../services/convo.service';

@Component({
  selector: 'app-convo-audio',
  templateUrl: './convo-audio.component.html',
  styleUrls: ['./convo-audio.component.css']
})
export class ConvoAudioComponent implements OnInit, AfterViewInit {
  // When user made reload of his browser tab or close it, we disconnect user from convo
  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: Event) {
    this.twilioService.roomObj?.disconnect();
  }

  @ViewChild('participants', { static: false }) participants?: ElementRef;

  @Input() permissions = null;
  @Input() convoList: any = null;
  @Input() people: any = null;
  @Input() selectedAudioOption: any = null;

  @Output() endConvoEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() leaveConvoEvent: EventEmitter<void | string> = new EventEmitter<void | string>();
  @Output() updateInfoEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() kickUserFromConferenceEvent: EventEmitter<void> = new EventEmitter<void>();

  public isAudioMuted = false;
  public isUserMenuExpanded = false;
  public userAvatarSrc?: SafeResourceUrl;
  public numberOfParticipants = 1;
  public isPreviewOptionSet = false;

  // variable to know if user disconnected by himself, or he was kicked
  private isUserDisconnected = false;
  private unsubscribe$: Subject<void> = new Subject();
  private participantIdentity = [];

  constructor(
    public twilioService: TwilioService,
    public userService: UserService,
    private convoService: ConvoService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.userAvatarSrc = this.userService.getAvatarUrl(0);

    this.convoService.endConvoSubject
      .asObservable()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => this.endConvo());
    this.twilioService.updatesSubject
      .asObservable()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        if (!this.isPreviewOptionSet) {
          if (this.selectedAudioOption) {
            this.muteAudio();
          }

          this.isPreviewOptionSet = true;
        }

        // if admin kick user
        setTimeout(() => {
          if (
            !this.isUserDisconnected &&
            res === 'disconnected' &&
            !this.twilioService.roomObj?.localParticipant?.tracks?.size
          ) {
            this.kickUserFromConferenceEvent.emit();
          }
        }, 0);

        if (res !== 'disconnected') {
          this.numberOfParticipants = res?.size + 1 || 1;
        }

        this.twilioService.roomObj?.participants?.forEach((participant: any) => {
          let trackName;

          participant.audioTracks.forEach((item: any) => (trackName = item.trackName));

          if (trackName) {
            this.participantIdentity[participant.identity] = trackName;
          }

          this.registerParticipantEvents(participant);
        });
      });
  }

  ngAfterViewInit(): void {
    //update users in convo
    this.twilioService.updatesSubject.subscribe(() => {
      this.updateInfoEvent.emit();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  //mute or unmute localParticipant audio
  public muteAudio(): void {
    if (!this.isAudioMuted) {
      this.twilioService.roomObj?.localParticipant.audioTracks.forEach((publication: any) => publication.track.disable());
    } else {
      this.twilioService.roomObj?.localParticipant.audioTracks.forEach((publication: any) => publication.track.enable());
    }

    this.isAudioMuted = !this.isAudioMuted;
  }

  public endConvo(): void {
    this.isUserDisconnected = true;
    this.endConvoEvent.emit();
  }

  public leaveConvo(): void {
    this.isUserDisconnected = true;
    this.leaveConvoEvent.emit();
  }

  // expand settings on 3 dots button
  public expandMenuSettings(): void {
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
  private getConvoUserAvatar(userId: string): string {
    return this.userService.getAvatarUrl(0, this.getConvoUserInfo(userId));
  }

  private registerParticipantEvents(participant: RemoteParticipant): void {
    if (participant) {
      participant.tracks.forEach(publication => this.subscribe(publication));
      participant.on('trackPublished', publication => this.subscribe(publication));
      participant.on('trackUnpublished', publication => {
        if (publication && publication.track) {
          this.detachRemoteTrack(publication.track);
        }
      });
    }
  }

  private subscribe(publication: RemoteTrackPublication): void {
    if (publication && publication.on) {
      publication.on('subscribed', (track: RemoteTrack) => this.attachRemoteTrack(track));
      publication.on('unsubscribed', (track: RemoteTrack) => this.detachRemoteTrack(track));
    }
  }

  //attach participants blocks
  private attachRemoteTrack(track: RemoteTrack): void {
    if (this.isAttachable(track) && track.kind === 'audio') {
      const div = document.createElement('div');
      const img = document.createElement('img');
      const microDisabledImage = document.createElement('img');
      const participantNameWrapper = document.createElement('div');
      const participantName = document.createElement('div');
      const userAvatar: HTMLImageElement = document.createElement('img');
      const userId: string = Object.keys(this.participantIdentity).filter(key => {
        return this.participantIdentity[key as any] === track.name;
      })[0];
      const userInfo: WhoAmI | null = this.getConvoUserInfo(userId);

      img.src = 'images/convo-participant-settings-white.svg';
      microDisabledImage.src = 'images/convo-participant-audio-disabled.svg';
      userAvatar.src = this.getConvoUserAvatar(userId);
      participantName.innerText = userInfo?.given_name + ' ' + userInfo?.family_name;

      // show disabled icon when audio track disabled or hide it
      if (track.isEnabled) {
        this.renderer.addClass(microDisabledImage, 'display-none');
      }

      // append parent div
      this.renderer.setAttribute(div, 'class', track.name);
      this.renderer.appendChild(this.participants?.nativeElement, div);
      this.renderer.addClass(
        this.participants?.nativeElement.getElementsByClassName(track.name)[0],
        'convo-participant-div'
      );

      // append name wrapper
      this.renderer.setAttribute(participantNameWrapper, 'class', 'convo-participant-name');
      this.renderer.appendChild(
        this.participants?.nativeElement.getElementsByClassName(track.name)[0],
        participantNameWrapper
      );

      // append name icon
      this.renderer.addClass(microDisabledImage, 'micro-disabled-image');
      this.renderer.appendChild(participantNameWrapper, microDisabledImage);

      // append username
      this.renderer.appendChild(participantNameWrapper, participantName);

      // append tree dots img if user have permission
      if (this.permissions?.['moderate_others']) {
        this.renderer.setAttribute(img, 'class', 'convo-paricipant-three-dots-img');
        this.renderer.appendChild(this.participants?.nativeElement.getElementsByClassName(track.name)[0], img);
      }

      // append user avatar
      this.renderer.setAttribute(userAvatar, 'class', 'convo-participant-avatar');
      this.renderer.appendChild(this.participants?.nativeElement.getElementsByClassName(track.name)[0], userAvatar);

      this.attachTrackEnabledDisabledHandlers(track);
      this.addListenerForOptionsImage(img, userId);
    }
  }

  private detachRemoteTrack(track: RemoteTrack): void {
    if (this.isDetachable(track)) {
      this.participants?.nativeElement.getElementsByClassName(track.name)[0]?.remove();
      track.detach().forEach(el => el.remove());
    }
  }

  // show user video when user enable video or show avatar if user disable video
  private attachTrackEnabledDisabledHandlers(track: RemoteTrack): void {
    track.on('enabled', () => {
      if (track.kind === 'audio') {
        const participantDiv: HTMLDivElement = this.participants?.nativeElement.getElementsByClassName(track.name)[0];

        this.renderer.addClass(participantDiv.getElementsByClassName('micro-disabled-image')[0], 'display-none');
      }
    });

    track.on('disabled', () => {
      if (track.kind === 'audio') {
        const participantDiv: HTMLDivElement = this.participants?.nativeElement.getElementsByClassName(track.name)[0];

        this.renderer.removeClass(participantDiv.getElementsByClassName('micro-disabled-image')[0], 'display-none');
      }
    });
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

  private addListenerForOptionsImage(optionsImage: any, userId: string): void {
    if (this.permissions?.['moderate_others']) {
      // show remove participant from call option
      this.renderer.listen(optionsImage, 'click', event => {
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
  }
}
