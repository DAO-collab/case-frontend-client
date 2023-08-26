export interface IApp {
  host_id: string;
  host_user_granted_fields: string[];
  host_granted_status: number;
  host_user_status: number;
  host_user_type: string;
  name: string;
  require_userfields: string[];
  website: string;
  favicon?: string;
}
