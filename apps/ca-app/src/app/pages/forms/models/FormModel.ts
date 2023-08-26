import { IMedia } from '@app/pages/feeds/models/feed.model';
import { NotificationModel } from '../../../directives/component-directives/notification-field/models/NotificationModel';

class ISchema {
  meta_data?: any = {};
  schema: any = {};
  tabs?: any = {};
}

export class FormModel {
  form_id? = '';
  sign_id? = '';
  name = '';
  description? = '';
  published = 0;
  pages_ct = 0;
  schema? = new ISchema();
  media?: IMedia;
  media_ct?: number;
  media_asset_id? = '';
  meta_data?: any = {};
  instant_notify = true;
  mediaId?: string;
  notifications?: NotificationModel = {
    names: [],
    values: [],
    valid: true
  };
  permissions: string[] | undefined = [];
  participants_ids?: string[] = [];
  duration?: any = {
    due_date: '',
    rrule: ''
  };
  type = '';
  field_participants?: any = {};
  pages?: any[];
  responses?: { [key: string]: string };
  responses_ct?: number;
  total_responses_ct?: number;
}

export class UpdateFormModel {
  description?: string;
  duration?: {
    due_date: string;
    rrule: string;
  };
  name?: string;
  instant_notify?: boolean;
  notifications?: NotificationModel | any;
  participants_ids?: string[] | null;
  field_participants: any;
  published?: number;
  schema: ISchema | any;
  meta_data: any;
  pages?: any[];

  constructor(init?: Partial<UpdateFormModel>) {
    this.description = init?.description;
    this.duration = init?.duration;
    this.name = init?.name;
    this.notifications = init?.notifications;
    this.participants_ids = init?.participants_ids;
    this.published = init?.published;
    this.pages = init?.pages;

    if (
      init?.field_participants &&
      Object.values(init.field_participants) &&
      Object.values(init.field_participants)[0]
    ) {
      this.field_participants = init.field_participants;
    }

    // if (init.schema && Object.keys(init.schema).length) {
    //   this.schema = {
    //     ...init.schema,
    //     ...(init.meta_data ? { meta_data: init.meta_data } : {})
    //   };
    // } else {
    //   this.schema = {
    //     schema: { schema: { properties: {} }}
    //   };
    // }
  }
}
