/**
 * User model.
 */
export interface IUser {
  user_id: string;
  given_name: string;
  family_name: string;
  country: string;
  birthdate: string;
  email: string;
  phone: string;
  email_verified: number;
  phone_verified: number;
  created_on: Date;
  updated_on: Date;
  zoneinfo: string;
  doc_id: string;
  editLink: string;
  gender: string;
  locale: string;
  picture: string;
  address1: string;
  address2: string;
  company: string;
  title: string;
  locality: string;
  postal_code: string;
  region: string;
  incomplete_profile: boolean;
  meta: { sync_fields_updated_on: Date; create_app: boolean; tour_completed?: boolean };
  notifications: string[];
  private: {
    email_reset: { alias: string; expire: number };
    host_write_fields_id: string;
    phone_reset: { alias: string; expire: number };
  };
  selfLink: string;
  muted_notifications: string[];
}
