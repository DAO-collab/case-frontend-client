/**
 * Application model.
 */
export interface IApp {
  favicon: string;
  host_id: string;
  host_read_fields: string[];
  host_granted_status: number;
  host_user_status: number;
  host_user_type: HostUserType;
  require_userfields: Array<keyof IUserFields>;
  name: string;
  website: string;
  user_id: string;
  host_revoked_notifications: Array<{ notification: string; reason: string }>;
  billing_plan: string;
}

/**
 * IApiGridResponse model.
 */
export interface IApiGridResponse<T> {
  currentItemCount: number;
  items: T;
  selfLink: string;
}

/**
 * Host user types.
 */
export enum HostUserType {
  Admin = 'admin',
  User = 'user',
  Manage = 'manage'
}

/**
 * New application model.
 */
export interface INewApp {
  plan?: string;
  company: string;
  website: string;
}

/**
 * Response model for creating new application.
 */
export interface INewAppResponse {
  host_id: string;
  selfLink: string;
}

/**
 * User fields model.
 */
export interface IUserFields {
  address_address1: string;
  address_address2: string;
  address_country: string;
  address_locality: string;
  address_postal_code: string;
  address_region: string;
  basic_family_name: string;
  basic_given_name: string;
  basic_locale: string;
  basic_zoneinfo: string;
  contact_email: string;
  contact_phone: string;
  extended_birthdate: string;
  extended_company: string;
  extended_gender: string;
  extended_title: string;
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
export interface IPaymentCardInfo {
  cardholder_name: string;
  token: string;
}

/**
 * Payment model.
 */
export interface IPaymentModel {
  square: {
    customer_id: string;
    active: boolean;
    card: {
      card_brand: string;
      exp_month: number;
      exp_year: number;
      last_4: string;
      cardholder_name: string;
      card_id: string;
    };
  };
  selfLink: string;
  editLink: string;
  billing_plan?: string;
}
