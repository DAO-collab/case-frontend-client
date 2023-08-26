import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { saveAs as importedSaveAs } from 'file-saver';
import { HOSTS_PRIVATE_CDN_URL } from './../shared/constants.utils';
import { IMedia, IMediaObject, IMediaInfo } from '../pages/modules/media/models/media.model';

interface ISrcRequest {
  urlKey: string;
  ext: string;
  width: string;
  displayCount?: number;
}

@Injectable()
export class FeedMediaService {
  private withCredentials = { withCredentials: true };
  private playingMedia: any[] = [];

  constructor(private http: HttpClient, public sanitizer: DomSanitizer) {}

  /**
   * Get media link
   * @param request: ISrcRequest
   */
  public getMediaSrc(request: ISrcRequest): string {
    let mediaLink = `${request.urlKey
      .replace('${display_size}', request.width)
      .replace('${display_format}', request.ext)}`;

    if (~mediaLink.indexOf('${display_count}')) {
      mediaLink = mediaLink.replace('${display_count}', `${request.displayCount}`);
    }

    return HOSTS_PRIVATE_CDN_URL(mediaLink);
  }

  /**
   * Get media stream link
   * @param urlKey: string
   */
  public getMediaLink(urlKey: string): string {
    return HOSTS_PRIVATE_CDN_URL(urlKey);
  }

  /**
   * Download document
   * @param url: string
   * @param name: string
   */
  public downloadDocument(url: string, name: string) {
    return this.http
      .get(url, {
        ...this.withCredentials,
        responseType: 'blob',
        headers: {
          'Content-Type': 'blob'
        }
      })
      .subscribe((responseData: Blob) => importedSaveAs(responseData, name));
  }

  /**
   * Load all feed attachments
   * @param medias: IMedia
   * @param postId: string
   */
  public loadAllFeedAttachments(medias: IMedia) {
    const mediaFiles: any[] = [];
    const keys: any = medias ? Object.keys(medias) : null;

    if (medias) {
      keys.map((mediaId: any) => {
        const mediaObject: IMediaObject = medias[mediaId as keyof IMedia];

        if (mediaObject.ct) {
          for (const mediaItemKey of Object.keys(mediaObject?.items!)) {
            const mediaItem = mediaObject?.items![mediaItemKey];
            const extValue =
              (mediaItem.display_formats && mediaItem.display_formats[0]) || mediaItem.original.split('.').pop();
            const urlKeyValue = mediaItem.display_start ? mediaItem.display_start : '';
            const obj: IMediaInfo = {
              name: mediaItem.tag_id,
              src: (null as any),
              media_group: mediaId,
              ext: (extValue as any),
              status: mediaItem.execution_status,
              url: {},
              displayCount: mediaItem.display_count,
              downloadLink: this.getMediaLink(mediaItem.original),
              stream: (mediaItem.stream as any),
              duration: mediaItem.duration
            };

            mediaFiles.push(this.getViwerObject(obj, urlKeyValue, (extValue as any), mediaItem.display_sizes));
          }
        }
      });
    }

    return mediaFiles;
  }

  /**
   * Get viewer object
   * @param info: MediaInfo
   * @param urlKey: string
   * @param extValue: string
   * @param sizes: number
   */
  public getViwerObject(info: IMediaInfo, urlKey: string, extValue: string, sizes?: number[]) {
    const variants: any = {
      images: (obj: IMediaInfo) => {
        obj.url.path = this.getMediaSrc({
          ext: extValue,
          urlKey,
          displayCount: obj.displayCount,
          width: (Math.max.apply(null, sizes!) as any)
        });

        return {
          name: obj.name,
          thumbnail: this.getMediaSrc({
            ext: extValue,
            urlKey,
            displayCount: obj.displayCount,
            width: '90'
          }),
          url: obj.url,
          downloadLink: obj.downloadLink,
          status: obj.status,
          type: 'images',
          extension: extValue
        };
      },
      videos: (obj: IMediaInfo) => {
        return {
          name: obj.name,
          src: this.getMediaLink(obj.stream),
          downloadLink: obj.downloadLink,
          status: obj.status,
          type: 'videos',
          extension: extValue
        };
      },
      docs: (obj: IMediaInfo) => {
        const path = Array.apply(null, ({ length: obj.displayCount } as any)).map((v, index) =>
          this.getMediaSrc({
            ext: extValue,
            urlKey,
            displayCount: index + 1,
            width: (Math.max.apply(null, sizes!) as any)
          })
        );

        obj.url.path = path;

        return {
          name: obj.name,
          downloadLink: obj.downloadLink,
          type: 'docs',
          url: obj.url,
          status: obj.status,
          thumbnail: this.getMediaSrc({
            ext: extValue,
            urlKey,
            width: '90',
            displayCount: obj.displayCount
          }),
          extension: extValue
        };
      },
      audios: (obj: IMediaInfo) => {
        return {
          name: obj.name,
          status: obj.status,
          downloadLink: obj.downloadLink,
          duration: obj.duration,
          stream: this.getMediaLink(obj.stream),
          type: 'audios',
          extension: extValue
        };
      }
    };

    return variants[info.media_group](info);
  }

  public addPlaying(obj: any) {
    this.playingMedia.push(obj);
  }
}
