export interface IMediaExtensions {
  audios: {
    [key: string]: string;
  };
  docs: {
    [key: string]: string;
  };
  images: {
    [key: string]: string;
  };
  videos: {
    [key: string]: string;
  };
}

export interface IFeedPost {
  asset_id?: string;
  asset_type?: string;
  created_on?: string;
  host_id?: string;
  media?: IMedia;
  media_ct?: number;
  message?: string;
  permissions?: string[];
  tag_id: string;
  updated_on?: string;
  status?: string;
}

export interface IMedia {
  audios: IMediaObject;
  docs: IMediaObject;
  files: IMediaObject;
  images: IMediaObject;
  videos: IMediaObject;
}

export interface IMediaObject {
  ct: number;
  items?: {
    [key: string]: IMediaItem;
  };
}

export interface IMediaItem {
  content_type: string;
  display_count: number;
  display_formats: string[];
  display_sizes: number[];
  display_start: string;
  etag: string;
  execution_id: string;
  execution_status: MediaStatus;
  media_group: string;
  media_size: number;
  original: string;
  source: string;
  tag_id: string;
  stream?: string;
  duration?: number;
}

export interface IMediaAttachment {
  tag_id: string;
  media_group?: string;
  media_id?: string;
  status?: MediaStatus;
  src: string | ArrayBuffer;
  progress?: number;
}

export interface IMediaInfo {
  src: string;
  media_group: string;
  downloadLink: string;
  name: string;
  url: any;
  ext: string;
  stream: string;
  status: string;
  displayCount: number;
  duration?: number;
}
export interface IMediaResponse {
  asset_id: string;
  host_id: string;
  selfLink: string;
  editLink?: string;
}

export interface IAddMediaRequest {
  media: {
    media_key: string;
  }[];
}

export interface IFileToUpload {
  fileData: File;
  type: string;
  extension: string;
  fileGroup: string;
}

export enum FeedPostStatus {
  Ready = 'Ready',
  Processing = 'Processing',
  Failed = 'Failed'
}

export enum MediaStatus {
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED'
}

export interface NotificationItem {
  case_id: string;
  created_on: string;
  host_id: string;
  module_name: string;
  stream_id: string;
  subject: string;
  type: string;
  updated_on: string;
  user_id: string;
  who: {
    host: {
      name: string;
      host_id: string;
      website: string;
    };
    form: {
      form_id: string;
    };
    user: {
      user_id: string;
    };
    case: {
      case_id: string;
      case_tag_id: string;
    };
  };
}
