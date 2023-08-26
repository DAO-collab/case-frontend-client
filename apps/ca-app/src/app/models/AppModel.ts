/**
 * IApiGridResponse model.
 */
export interface IApiGridResponse<T> {
  currentItemCount: number;
  items: T;
  selfLink: string;
}

/**
 * Notification Item model.
 */
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
    form?: {
      form_id: string;
    };
    sign?: {
      sign_id: string;
    };
    event?: {
      event_id: string;
    };
    note?: {
      note_id: string;
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

export enum PublishType {
  form = 'FORM',
  sign = 'SIGN'
}
