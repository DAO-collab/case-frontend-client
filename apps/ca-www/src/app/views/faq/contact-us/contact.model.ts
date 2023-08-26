/**
 * Contact model.
 */
export interface IContact {
  email: string;
  family_name: string;
  given_name: string;
  importance: string;
  locale: string;
  message: string;
  recaptcha: string;
  topic: string;
}

/**
 * Importance enum.
 */
export enum Importance {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

/**
 * Department enum.
 */
export enum Department {
  Sales = 'Sales',
  Billing = 'Billing',
  Support = 'Support',
  Other = 'Other'
}
