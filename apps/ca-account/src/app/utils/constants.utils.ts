import { environment } from '@acc-envs/environment';

/**
 * Email pattern.
 */
// tslint:disable-next-line: max-line-length
export const EMAIL_REG_EXP =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Password pattern.
 */
export const PASSWORD_REG_EXP = /(?=[^A-Z]*[A-Z])(?=[^a-z]*[a-z])(?=[^0-9]*[0-8]).{8,}/;

/**
 * Website logo.
 */
export const LOGO = `${environment.PUBLIC_CDN_URL}/hosts/ca-main/logo/images/logo.png`;

/**
 * Favicon.
 */
export const FAVICON = `${environment.PUBLIC_CDN_URL}/hosts/ca-main/favicon/images/favicon.png`;

/**
 * Url to terms of use.
 */
export const { TERMS_OF_USE_URL } = environment;

/**
 * API url.
 */
export const API_URL = (path = '') => environment.ACCOUNT_API_URL + path;

/**
 * Url to contact us.
 */
export const CONTACT_US_URL = environment.ACCOUNT_CLIENT_URL + '/support';

/**
 * API url.
 */
export const MANAGE_API_URL = (path = '') => environment.MANAGE_API_URL + path;

/**
 * Options url for countries, time zones, languages, gender.
 */
export const OPTIONS_URL = (path: string, locale: string) => 'opts/' + locale + path + '.json';

/**
 * CDN url.
 */
export const PUBLIC_CDN_URL = (path: string) => environment.PUBLIC_CDN_URL + (path || '');

/**
 * Host CDN url.
 */
export const HOST_CDN_URL = (path: string) => environment.PUBLIC_CDN_URL + '/hosts' + (path || '');

/**
 * Response data object.
 */
export const RESPONSE_DATA = (response: any) => response.data || response;

/**
 * Application favicon.
 */
export const APP_FAVICON = (hostId: string): string =>
  `${environment.PUBLIC_CDN_URL}/hosts/${hostId}/favicon/images/favicon.png`;

/**
 * Application logo.
 */
export const APP_LOGO = (hostId: string): string =>
  `${environment.PUBLIC_CDN_URL}/hosts/${hostId}/logo/images/logo.png`;

/**
 * User avatar url.
 */
export const AVATAR_URL = (userId: string, size: string) =>
  `${environment.PUBLIC_CDN_URL}/users/${userId}/avatar/images/avatar?max_age=0&width=${size}&height=0`;

/**
 * Hosts public CDN url.
 */
export const HOSTS_PUBLIC_CDN_URL = (path: string, host: string): string =>
  environment.PUBLIC_CDN_URL + '/hosts/' + host + path;

/**
 * Http statuses.
 */
export const HTTP = {
  STATUSES: {
    UNAUTHORIZED: 401,
    ACCESS_DENIED: 403,
    NOT_FOUND: 404,
    ERROR: 500,
    OFFLINE: 0,
    CORS_ERROR: -1
  }
};

/**
 * Http events.
 */
export const EVENTS = {
  SUCCESS: 'SUCCESS',
  FORBIDDEN: 'ACCESS_DENIED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export const isToday = (value: string): boolean => {
  const inputDate = new Date(value);
  const todayDate = new Date();
  return inputDate.setHours(0, 0, 0, 0) === todayDate.setHours(0, 0, 0, 0);
};
