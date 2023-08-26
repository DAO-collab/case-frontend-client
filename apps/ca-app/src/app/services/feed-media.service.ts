import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { SrcRequest } from '../models/SrcRequest';
import { IMedia, IMediaObject } from '../pages/feeds/models/feed.model';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { MediaParent } from '@app/pages/feeds/feeds/types/media-parent.type';

@Injectable()
export class FeedMediaService {
  public allJson: any;

  private cdnUrl: string = environment.PUBLIC_CDN_URL;
  private privateCDN = environment.PRIVATE_CDN_URL + '/';
  private withCredentials = { withCredentials: true };
  private playingMedia: any[] = [];

  constructor(private http: HttpClient, public sanitizer: DomSanitizer) {
    this.cdnUrl = environment.APP_API_URL + '/' + location.hostname.split('.')[0];
  }

  public getMedia(caseId: string, url_key: string): Observable<any> {
    return this.http.get(this.privateCDN + '/' + url_key, this.withCredentials).pipe(pluck('data'));
  }

  public getMediaSrc(request: SrcRequest) {
    let mediaLink = `${this.privateCDN}${request.url_key
      .replace('${display_size}', request.width as any)
      .replace('${display_format}', request.ext)}`;

    if (~mediaLink.indexOf('${display_count}')) {
      mediaLink = mediaLink.replace('${display_count}', `${request.page}`);
    }

    return mediaLink;
  }

  public getFormMediaSrc(request: SrcRequest, pageNumber: any) {
    return `${this.privateCDN}${request.url_key
      .replace('${display_count}', pageNumber)
      .replace('${display_size}', request.width as any)
      .replace('${display_format}', request.ext)}`;
  }

  public getThumbnail(mediaData: MediaItemData, size?: number) {
    return mediaData.display_start
      ? this.privateCDN +
          mediaData.display_start
            .replace('${display_count}', `${mediaData.display_count}`)
            .replace('${display_size}', size || Math.min.apply(null, mediaData?.display_sizes!) as any)
            .replace('${display_format}', mediaData?.display_formats![0])
      : null;
  }

  public getFormMediaSrcForVideo(request: SrcRequest) {
    return (
      this.privateCDN +
      request.url_key
        .replace('${display_count}', '1')
        .replace('${display_size}', request.height as any)
        .replace('${display_format}', request.ext)
    );
  }

  public getOriginalMediaSrc(caseId: string, request: any) {
    return this.cdnUrl + '/' + caseId + '/private/case/posts/media?media=' + request.url_key;
  }

  public getMediaStream(stream: string) {
    return `${this.privateCDN}${stream}`;
  }

  public downloadDocument(url: string) {
    open(url, '_blank');
  }

  public openInUrlDocument(url: string, name: string) {
    window.open(url);
  }

  /**
   * loadAllFeedAttachments - needed to load feeds attachments
   * - loads attachments list of feeds after list of feeds is shown
   */
  public loadAllFeedAttachments(medias: IMedia, postId: string, caseId: string, mediaParentType: MediaParent = 'post', commentId?: string) {
    const images: any[] = [];
    const videos: any[] = [];
    const documents: any[] = [];
    const audios: any[] = [];
    const files: any[] = [];
    const keys = medias ? Object.keys(medias) : null;

    if (medias) {
      keys?.map(mediaId => {
        const mediaObject: IMediaObject = medias[mediaId as keyof IMedia];

        if (mediaObject.ct) {
          for (const mediaItemKey of Object.keys(mediaObject.items!)) {
            const media = mediaObject.items![mediaItemKey];
            const ext = media.display_formats && media.display_formats[0];
            const url_key = media.alias_display_start
              ? media.alias_display_start
              : media.display_start
              ? media.display_start
              : '';
            const displaySizes = media.display_sizes || [];
            const obj: AttachmentForViewer = {
              name: media.tag_id,
              originSrc: media.alias_original ? media.alias_original : media.original,
              src: null,
              downloadLink: `${this.privateCDN}${media.alias_original ? media.alias_original : media.original}`,
              path: null,
              thumbnail: media.thumbnail,
              status: media.execution_status,
              initialSrc: this.getOriginalMediaSrc(caseId, { ext, url_key }),
              media_group: mediaId,
              post_id: postId,
              ext,
              media_id: mediaItemKey,
              stream: media.alias_stream ? media.alias_stream : media.stream,
              display_count: media.display_count,
              mediaParentType
            };

            commentId && (obj.commentId = commentId);

            const thumbnailWidthSize = '90';

            if (mediaId === 'images') {
              obj.thumbnail = this.getMediaSrc({
                ext,
                url_key,
                height: '51',
                width: thumbnailWidthSize
              });
              obj.src = this.getMediaSrc({
                ext,
                url_key,
                height: '0',
                width: Math.max.apply(null, displaySizes)
              });

              images.push(obj);
            } else if (mediaId === 'videos') {
              obj.src = this.getMediaStream(media?.alias_stream ? media?.alias_stream : media?.stream!);

              const tempSrcRequest: SrcRequest = {
                url_key,
                ext,
                height: '180',
                width: '0'
              };

              obj.thumbnail = obj.thumbnail
                ? obj.thumbnail
                : url_key
                ? this.getFormMediaSrcForVideo(tempSrcRequest)
                : undefined;

              videos.push(obj);
            } else if (mediaId === 'audios') {
              obj.stream = obj.stream ? this.getMediaStream(obj.stream) : '';
              obj.duration = media.duration;

              audios.push(obj);
            } else if (mediaId === 'files') {
              files.push(obj);
            } else {
              const i = 0;

              obj.thumbnail = this.getMediaSrc({
                url_key,
                ext,
                page: i + 1,
                height: '51',
                width: thumbnailWidthSize
              });

              obj.src = this.getMediaSrc({
                url_key,
                ext,
                page: i + 1,
                height: '0',
                width: '180'
              });

              obj.path = Array.apply(null, ({ length: obj.display_count } as any)).map((v, i) =>
                this.getMediaSrc({
                  ext,
                  url_key,
                  height: '0',
                  width: Math.max.apply(null, displaySizes),
                  page: i + 1
                })
              ) as any;

              documents.push(obj);
            }
          }
        }
      });
    }

    const retObj: ExtensionsResponse = {
      images: {
        list: images,
        showAll: false
      },
      videos: {
        list: videos,
        showAll: false
      },
      audios: {
        list: audios,
        showAll: false
      },
      docs: {
        list: documents,
        showAll: false
      },
      files: {
        list: files,
        showAll: false
      }
    };

    Object.defineProperty(retObj, 'totalCount', {
      value: images.length + videos.length + audios.length + documents.length + files.length,
      enumerable: false,
      writable: true
    });

    return retObj;
  }

  // Data in 'info' argument extracted in loadAllFeedAttachments method
  public getViwerObject(info: AttachmentForViewer) {
    const variants: any = {
      images: (obj: AttachmentForViewer) => {
        return {
          name: obj.name,
          thumbnail: obj.thumbnail,
          src: obj.src,
          status: obj.status,
          type: 'images',
          downloadLink: obj.downloadLink,
          extension: obj.name?.split('.').pop()
        };
      },
      videos: (obj: AttachmentForViewer) => {
        return {
          name: obj.name,
          src: this.getMediaStream(obj.stream!),
          type: 'videos',
          downloadLink: obj.downloadLink,
          status: obj.status,
          extension: obj.name?.split('.').pop()
        };
      },
      docs: (obj: AttachmentForViewer) => {
        return {
          name: obj.name,
          downloadLink: obj.downloadLink,
          type: 'docs',
          src: obj.path,
          status: obj.status,
          extension: obj.name?.split('.').pop(),
          thumbnail: obj.thumbnail
        };
      },
      audios: (obj: AttachmentForViewer) => {
        return {
          name: obj.name,
          stream: obj.stream,
          duration: obj.duration,
          downloadLink: obj.downloadLink,
          type: 'audios',
          status: obj.status,
          extension: obj.name?.split('.').pop()
        };
      },
      files: (obj: AttachmentForViewer) => {
        return {
          name: obj.name,
          downloadLink: obj.downloadLink,
          type: 'files',
          status: obj.status,
          extension: obj.name?.split('.').pop()
        };
      }
    };

    return variants[info.media_group!](info);
  }

  /**
   * getExtesions - get list of supported files
   */
  public getExtesions(): Observable<ExtensionsResponse> {
    return this.allJson
      ? of(this.allJson)
      : this.http.get('/opts/en/filetypes/all.json').pipe(
          map((res: any) => {
            this.allJson = res;

            return this.allJson;
          })
        );
  }

  getStreamUrl(url: string) {
    return this.http.get(url, { withCredentials: true }).pipe(map((res: any) => res.data.url));
  }

  /**
   * addPlaying
   */
  public addPlaying(obj: any) {
    this.playingMedia.push(obj);
  }

  /**
   * clearPlayingMedia
   */
  public clearPlayingMedia(self: any) {
    this.playingMedia.map((v: any) => {
      if (self === v.self) {
        return;
      }
      v.fn();
    });

    this.playingMedia = [];
  }
}

export class ExtensionsResponse {
  audios: any;
  docs: any;
  images: any;
  videos: any;
  files: any;
  totalCount?: any;
  mediaParentType?: MediaParent;
  commentId?: string;
}

export interface IAllowedFileSizes {
  audios: number;
  docs: number;
  images: number;
  videos: number;
  files: number;
}

export class MediaItemData {
  display_count?: number;
  display_formats?: string[];
  display_sizes?: number[];
  display_start?: string;
  etag?: string;
  execution_id?: string;
  execution_status?: string;
  media_group?: string;
  media_id?: string;
  media_size?: number;
  metric_ids?: Metrics;
  original?: string;
  source?: string;
  tag_id?: string;
  thumbnail?: string;
}

export class AttachmentForViewer {
  display_count?: number;
  downloadLink?: string;
  ext?: string;
  initialSrc?: string;
  media_group?: string;
  media_id?: string;
  name?: string;
  originSrc?: string;
  post_id?: string;
  src?: string | null;
  status?: string;
  stream?: string;
  thumbnail?: string;
  path?: string | null;
  duration?: number;
  mediaParentType?: MediaParent;
  commentId?: string;
  play?: boolean;
}

export class Metrics {
  daily?: string;
}

export class Attachment {
  fileName?: string;
  thumbnail?: string;
  media?: string;
  progress?: number;
  src?: string;
  tag_id?: string;
}
