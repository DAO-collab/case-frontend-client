import { IDefaultResponse } from "./default-response.interface";

export interface TeamInfo {
  data: IDefaultResponse<Team[]>
};

export interface Team {
  case_id: string;
  case_notify: boolean;
  case_role_id: string;
  case_status: number;
  case_tag_id: string;
  created_on: string;
  family_name: string;
  full_name?: string;
  given_name?: string;
  host_cases_ct: number;
  host_granted_status: number;
  host_user_status: number;
  locale: string;
  role_id?: string;
  sync_info?: {
    given_name: string;
    family_name: string;
  };
  updated_on: string;
  uuid?: string;
  user_id: string;
  zoneinfo: string;
};