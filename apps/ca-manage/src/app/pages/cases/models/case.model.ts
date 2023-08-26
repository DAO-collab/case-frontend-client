import { SafeResourceUrl } from '@angular/platform-browser';

/*
 * Case interface
 */
export interface ICase {
  case_id?: string;
  case_status: CaseStatus;
  case_type: string;
  created_on?: string;
  updated_on?: string;
  tag_id: string;
  about: string;
  date_opened: string;
  meta_data?: {
    content: [{ [key: string]: any }];
    schema: [
      {
        $schema: string;
        properties: { [key: string]: any };
        required: string[];
        type: string;
      }
    ];
  };
}

/*
 * Case status enum
 */
export enum CaseStatus {
  Active = '1',
  Closed = '0'
}

/*
 * Case search attribute enum
 */
export enum CaseSearchAttribute {
  TagId = 'tag_id'
}

/*
 * Case search limit enum
 */
export enum CaseLimit {
  Limit = '5'
}

/*
 * Create Relation interface
 */
export interface ICreateCaseRelation {
  case_id: string;
  case_notify: boolean;
  case_role_id: string;
  user_id: string;
}

/*
 * Create Relation interface
 */
export interface ICaseDefaultResponse {
  case_id: string;
  host_id: string;
  selfLink: string;
  nextLink: string;
  startKey: string;
}

/*
 * Assigned user to the case interface
 */
export interface ICaseAssignedUser {
  case_id?: string;
  case_notify?: boolean;
  case_role_id: string;
  case_sync_fields_updated_on?: string;
  case_tag_id?: string;
  created_on?: string;
  family_name: string;
  given_name: string;
  host_user_status: number;
  locale?: string;
  updated_on?: string;
  user_id: string;
  zoneinfo?: string;
  avatar?: SafeResourceUrl;
}

export interface IAssignUser {
  notify: boolean;
  role_id: string;
  user_id: string;
}

/*
 * Case model
 */
export class CaseModel {
  public about = '';
  public tagId = '';
  public dateOpened: any = new Date();
  public status = CaseStatus.Active;
}
