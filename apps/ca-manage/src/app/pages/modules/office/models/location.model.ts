/*
 * Location interface
 */
export interface ILocation {
  tag_id: string;
  address: string;
  asset_id?: string;
  asset_type?: string;
  created_on?: string;
  host_id?: string;
  updated_on?: string;
  permissions?: string[];
  main_office?: any;
}
