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

export enum UserType {
  Admin = 'admin',
  Manage = 'manage',
  User = 'user'
}
