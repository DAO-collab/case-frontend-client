import { CompanySystem } from "@app/interfaces/company-system.interface";

export interface WhoAmIResponse {
  data: WhoAmI;
};

export interface WhoAmI {
  birthday: string;
  company: string
  company_name: string;
  company_system: CompanySystem;
  country: string;
  family_name: string;
  gender: string;
  given_name: string;
  locale: string;
  picture?: any;
  role_id?: string;
  selfLink: string;
  sync_info?: any;
  title: string;
  user_id: string;
  user_type: string;
  zone_info: string;
};