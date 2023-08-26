import { IMedia } from "@app/pages/feeds/models/feed.model";

export interface FormSignResponse {
  data: {
    case_id: string;
    created_on: Date;
    editLink: string;
    encoding_ct: number;
    media: IMedia
    media_ct: number;
    module_name: string;
    parent_id: string;
    response: { [key: string]: unknown }[];
    response_id: string;
    selfLink: string;
    updated_on: Date;
    user_id: string;
  }
};