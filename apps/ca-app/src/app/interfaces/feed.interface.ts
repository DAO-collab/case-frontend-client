import { IMedia } from "@app/pages/feeds/models/feed.model";

export interface DeleteFeedRequest {
  case_id: string;
  post_id: string;
};

export interface FeedsLibraryItem {
  asset_id: string;
  created_on: string;
  host_id: string;
  media?: IMedia;
  media_ct: number;
  message: string;
  permissions: string[];
  tag_id: string;
  updated_on: string;
};

export interface FormFieldProperty {
  type: string;
  fieldType: string;
  title: string;
  name: string;
  field_name: string;
  description: string;
  required: boolean;
  readonly: boolean;
  defaultValue: any;
  pattern: any;
  items: any;
  key: string;
}
