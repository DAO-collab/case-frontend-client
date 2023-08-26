export interface IWebhook {
  asset_id?: string;
  active: boolean;
  description: string;
  source_cidr: string;
  url: string;
  events: string[];
}
