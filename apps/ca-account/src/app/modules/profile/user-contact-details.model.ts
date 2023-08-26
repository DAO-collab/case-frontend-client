/**
 * Contact details model.
 */
export interface IUserContactDetails {
  email: string;
  phone: string;
}

/**
 * Contact details type.
 */
export enum ContactDetailsType {
  Email = 'email',
  Phone = 'phone'
}

/**
 * Account page tabs.
 */
export enum AccountPageTabs {
  Contact = 'contact',
  Password = 'password'
}
