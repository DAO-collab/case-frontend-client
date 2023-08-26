export interface SignUp {
  create_app: boolean;
  email: string;
  family_name: string;
  given_name: string;
  locale: string;
  pin: string | null;
  zoneinfo: string;
};