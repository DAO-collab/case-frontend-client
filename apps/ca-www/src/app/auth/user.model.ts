/**
 * User model.
 */
export interface IUser {
  email: string;
  given_name: string;
  family_name: string;
  password: string;
  confirm_password: string;
  locale: string;
  zoneinfo: string;
  agreed: boolean;
}

/**
 * API response model.
 */
export interface IApiResponse {
  data: {
    message: string;
    selfLink: string;
  };
}
