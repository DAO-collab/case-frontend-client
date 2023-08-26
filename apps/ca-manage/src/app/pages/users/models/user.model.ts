import { SafeResourceUrl } from '@angular/platform-browser';

/*
 * User interface
 */
export interface IUser {
  email?: string;
  locale: string;
  zoneinfo: string;
  family_name: string;
  given_name: string;
  username: string;
  notify?: boolean;
  user_id?: string;
  created_on?: string;
  email_verified?: any;
  host_id?: string;
  host_meta_data?: any;
  host_sync_fields_updated_on?: string;
  host_user_granted_fields?: string[];
  host_granted_status?: number;
  host_user_status?: number;
  host_user_type?: string;
  host_tag_id?: string;
  updated_on?: string;
  birthdate?: any;
  country?: string;
  avatars?: any;
  avatar?: SafeResourceUrl;
  phone?: any;
  address1?: string;
  address2?: string;
  company?: string;
  host_notifications?: string[];
  gender?: string;
  locality?: string;
  postal_code?: string;
  region?: string;
  title?: string;
  host_muted_notifications?: string[];
  host_intake_completed_on?: Date;
  host_intake_data?: any;
}

/*
 * User search attribute enum
 */
export enum UserSearchAttribute {
  Email = 'email',
  Phone = 'phone',
  FirstName = 'given_name',
  LastName = 'family_name',
  TagId = 'host_tag_id',
  UserType = 'host_user_type'
}

/*
 * Username type enum
 */
export enum UsernameType {
  Email = 'email',
  Phone = 'phone',
  FirstName = 'given_name',
  LastName = 'family_name',
  TagId = 'host_tag_id'
}

/*
 * User type enum
 */
export enum UserType {
  Admin = 'admin',
  Manager = 'manager',
  User = 'user'
}

/*
 * User type enum
 */
export enum UserStatus {
  Disabled = 'Disabled',
  Active = 'Active'
}

export enum UserLimit {
  Limit = '1'
}

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
