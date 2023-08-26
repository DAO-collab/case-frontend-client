import { Component, OnInit, ElementRef, Input, AfterViewInit } from '@angular/core';
import { FeedMediaService } from '../../../../../services/feed-media.service';
import videojs from 'video.js';

@Component({
  selector: 'app-audiojs',
  template: `
    <div>
      <audio
        preload="none"
        id="audio_{{ idx }}"
        class="audio-js vjs-default-skin vjs-big-play-centered vjs-16-9"
        controls
        preload="none"
        width="640"
        height="264"
      ></audio>
    </div>
  `,
  styleUrls: ['./audiojs.component.css']
})
export class AudioJSComponent implements OnInit, AfterViewInit {
  // index to create unique ID for component
  @Input() idx?: string;

  // audio asset url
  @Input() url: any;

  @Input() duration: any;

  // declare player var
  private player: any;
  public firstLoad = true;

  // constructor initializes our declared vars
  constructor(private elementRef: ElementRef, private feedMediaService: FeedMediaService) {
    this.url = false;
    this.player = false;
  }

  ngOnInit() {}

  ngAfterViewInit() {
    // setup the player via the unique element ID
    const player = document.getElementById('audio_' + this.idx);
    this.player = videojs(player);
    this.player.duration(+this.duration);

    this.elementRef.nativeElement.querySelector('.vjs-play-control').addEventListener('click', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      const startPlay = () => {
        this.feedMediaService.addPlaying({
          player: this.player,
          self: this,
          fn: () => this.player.pause().trigger('loadstart')
        });
      };

      this.player = this.player ? this.player : videojs(player);
      if (this.firstLoad) {
        this.player['src']({
          src: this.url,
          type: 'application/x-mpegURL',
          withCredentials: true
        });

        this.firstLoad = false;
      }
      startPlay();
    });
  }
}
