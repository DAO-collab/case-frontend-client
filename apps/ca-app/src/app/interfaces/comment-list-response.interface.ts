import { IMedia } from "@app/pages/feeds/models/feed.model";

export interface CommentListResponse {
  currentItemCount: number;
  items: CommentListItem[];
  selfLink: string;
  startKey: string;
};

export interface CommentListItem {
  avatar?: string;
  case_id: string;
  comment_id: string;
  created_on: Date;
  encoding_ct: number;
  media: IMedia;
  media_ct: number
  message: string;
  module_name: string;
  parent_id: string;
  post_index?: number;
  updated_on: Date;
  user_id: string;
};