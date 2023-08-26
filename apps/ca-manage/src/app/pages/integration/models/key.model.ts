export interface IKey {
  asset_id?: string;
  active: boolean;
  description: string;
  source_cidr: string;
  domain: string;
  last_used?: string;
  last_used_ip?: string;
}
