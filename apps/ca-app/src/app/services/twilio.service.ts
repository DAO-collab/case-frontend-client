import { ElementRef, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { Subject } from 'rxjs';

import {
  connect,
  LocalVideoTrack,
  RemoteAudioTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteVideoTrack,
  Room
} from 'twilio-video';

import { ConvoService } from './convo.service';
import { GaussianBlurBackgroundProcessor } from '@twilio/video-processors';

@Injectable({
  providedIn: 'root'
})
export class TwilioService {
  remoteVideo?: ElementRef;
  localVideo?: ElementRef;
  roomObj?: Room | any;
  microphone = true;
  roomParticipants?: any;
  updatesSubject: Subject<any> = new Subject();
  dominantSpeaker: Subject<RemoteParticipant> = new Subject();
  // isParticipantVideoZoomed = false;
  optionsBeforeChangingTab: any = {
    video: null,
    audio: null,
    blur: null
  };
  browserName = '';
  browserVersion: any = 0;
  private renderer: Renderer2;

  constructor(
    private convoService: ConvoService,
    private http: HttpClient,
    private router: Router,
    private rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.browserName = this.detectBrowserName();
    this.browserVersion = this.detectBrowserVersion();
  }

  connectToRoom(accessToken: string, options: any): void {
    connect(accessToken, options).then(
      async room => {
        if (this.convoService.updatePageInterval) {
          clearInterval(this.convoService.updatePageInterval);
          this.convoService.updatePageInterval = null;
        }
        if (options.blur && this.isSupportBlur()) {
          const bg = new GaussianBlurBackgroundProcessor({
            assetsPath: '/assets/tensor/',
            maskBlurRadius: 50,
            blurFilterRadius: 50
          });
          await bg.loadModel();
          room.localParticipant.tracks.forEach(track => {
            if (track.kind == 'video') {
              let videoTrack = track.track as LocalVideoTrack;
              videoTrack.addProcessor(bg);
            }
          });
        }
        this.roomObj = room;
        this.updatesSubject.next(room.participants);
        this.roomParticipants = room.participants;

        room.participants.forEach(participant => {
          this.attachParticipantTracks(participant);
        });

        room.on('dominantSpeakerChanged', participant => {
          this.dominantSpeaker.next(participant);
        });

        room.on('participantDisconnected', participant => {
          this.detachTracks(participant);
          this.updatesSubject.next(room.participants);
        });

        room.on('participantConnected', participant => {
          this.roomParticipants = room.participants;

          this.attachParticipantTracks(participant);
          this.updatesSubject.next(room.participants);
        });

        // When a Participant adds a Track, attach it to the DOM.
        room.on('trackPublished', (track, participant) => {
          this.attachTracks([track]);
        });

        // When a Participant removes a Track, detach it from the DOM.
        room.on('trackUnpublished', (track, participant) => {
          this.detachTracks([track]);
        });

        room.on('disconnected', room => {
          this.updatesSubject.next('disconnected');

          room.localParticipant.tracks.forEach((track: any) => {
            track?.track.stop();
            const attachedElements = track?.track.detach();

            attachedElements?.forEach((element: any) => element.remove());
            room.localParticipant?.videoTracks.forEach(video => {
              const trackConst = [video][0].track;
              trackConst.stop(); // <- error

              trackConst?.detach().forEach(element => element.remove());
              room?.localParticipant.unpublishTrack(trackConst);
            });

            let element = this.remoteVideo?.nativeElement;
            while (element?.firstChild) {
              element?.removeChild(element?.firstChild);
            }

            let localElement = this.localVideo?.nativeElement;
            while (localElement?.firstChild) {
              localElement?.removeChild(localElement?.firstChild);
            }
          });
        });
      },
      error => {
        alert(error.message);
        console.log(error);
      }
    );
  }

  attachParticipantTracks(participant: any): void {
    participant.tracks.forEach((part: any) => {
      this.trackPublished(part);
    });
  }

  trackPublished(publication: any) {
    if (publication.isSubscribed) this.attachTracks(publication.track);

    if (!publication.isSubscribed)
      publication.on('subscribed', (track: any) => {
        this.attachTracks(track);
      });
  }

  async attachTracks(tracks: any) {
    if (this.isAttachable(tracks)) {
      const element = await tracks.attach();
      this.renderer.data['id'] = tracks.sid;
      this.renderer.setStyle(element, 'height', '100%');
      this.renderer.setStyle(element, 'max-width', '100%');

      if (element && this.remoteVideo?.nativeElement) {
        this.renderer?.appendChild(this.remoteVideo?.nativeElement, element);
      }
    }
  }

  detachTracks(tracks: any): void {
    tracks?.tracks?.forEach((track: any) => {
      let element = this.remoteVideo?.nativeElement;
      while (element?.firstChild) {
        element.removeChild(element?.firstChild);
      }
    });
  }

  private isAttachable(track: RemoteTrack): track is RemoteAudioTrack | RemoteVideoTrack {
    return (
      !!track && ((track as RemoteAudioTrack).attach !== undefined || (track as RemoteVideoTrack).attach !== undefined)
    );
  }
  detectBrowserName() {
    const agent = window.navigator.userAgent.toLowerCase();
    switch (true) {
      case agent.indexOf('edge') > -1:
        return 'edge';
      case agent.indexOf('opr') > -1 && !!(<any>window).opr:
        return 'opera';
      case agent.indexOf('chrome') > -1 && !!(<any>window).chrome:
        return 'chrome';
      case agent.indexOf('trident') > -1:
        return 'ie';
      case agent.indexOf('firefox') > -1:
        return 'firefox';
      case agent.indexOf('safari') > -1:
        return 'safari';
      default:
        return 'other';
    }
  }

  detectBrowserVersion() {
    var userAgent = navigator.userAgent,
      tem,
      matchTest = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

    if (/trident/i.test(matchTest[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(userAgent) || [];
      return 'IE ' + (tem[1] || '');
    }
    if (matchTest[1] === 'Chrome') {
      tem = userAgent.match(/\b(OPR|Edge)\/(\d+)/);
      if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    matchTest = matchTest[2] ? [matchTest[1], matchTest[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = userAgent.match(/version\/(\d+)/i)) != null) matchTest.splice(1, 1, tem[1]);
    return parseInt(matchTest[1]);
  }
  public isSupportBlur() {
    if (this.browserName === 'chrome' && this.browserVersion < 92) return false;
    if (this.browserName === 'firefox') return false;
    return true;
  }
}
