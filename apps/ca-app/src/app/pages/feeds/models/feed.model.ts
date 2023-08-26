import { SafeResourceUrl } from '@angular/platform-browser';
import { MediaParent } from '../feeds/types/media-parent.type';
export interface IAddFeedRequest {
  media: string[];
  message: string;
  permissions: string[];
}

export interface IFileToUpload {
  fileData: File;
  type: string;
  extension: string;
  fileGroup: string;
  mediaParentType?: MediaParent;
  postId?: string;
}

export interface IMediaAttachment {
  tag_id: string;
  media_group?: string;
  media_index?: number;
  status?: MediaStatus;
  src: string | ArrayBuffer | SafeResourceUrl;
  progress?: number;
  mediaParentType?: MediaParent;
  postId?: string;
  commentId?: string;
}

export interface IFeed {
  case_id: string;
  comments: {
    created_on: string;
    message: string;
    user_id: string;
  }[];
  comments_ct: number;
  created_on: string;
  media: IMedia;
  media_ct: number;
  message: string;
  permissions: string[];
  post_id: string;
  updated_on: string;
  user_id: string;
  uuid?: string;
  showCommens?: boolean;
  showAllComments?: boolean;
  showAddComment?: boolean;
  replaceMessage?: string;
  activeEditing?: boolean;
  loading?: boolean;
  replacePermissions?: string[];
}

export type IMedia = {
  [key in MediaType]: IMediaObject;
};

export interface IMediaObject {
  ct: number;
  items?: {
    [key: string]: IMediaItem;
  };
}

export interface IMediaItem {
  alias_original: string;
  alias_pdf: string;
  alias_stream: string;
  alias_display_start: string;
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
  thumbnail?: string;
}

export interface IAwsUploadData {
  fields: {
    AWSAccessKeyId: string;
    'Cache-Control': string;
    'Content-Disposition': string;
    'Content-Type': string;
    acl: string;
    key: string;
    policy: string;
    signature: string;
    success_action_status: number;
    'x-amz-meta-media_group': string;
    'x-amz-meta-tag_id': string;
    'x-amz-security-token': string;
  };
  selfLink: string;
  url: string;
}

export enum MediaType {
  Audio = 'audios',
  Doc = 'docs',
  File = 'files',
  Image = 'images',
  Video = 'videos'
}

export enum MediaStatus {
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED'
}
