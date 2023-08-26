import { UntypedFormControl } from '@angular/forms';
import { environment } from '../../environments/environment';

/**
 * Variable extracted from the environment file and made available in other files.
 */
export const { ACCOUNT_CLIENT_URL, PUBLIC_CDN_URL, TERMS_OF_USE_URL } = environment;

/**
 * Url for contact us
 */
export const CONTACT_US_URL = environment.ACCOUNT_CLIENT_URL + '/support';

/**
 * Manage API url.
 */
export const MANAGE_API_URL = (path = '') => environment.MANAGE_API_URL + path;

/**
 * Account API url.
 */
export const ACCOUNT_CLIENT_URL_PLAIN = (path = '') => environment.ACCOUNT_CLIENT_URL + path;

/**
 * API url.
 */
export const API_URL = (path = '', debug?: any): string =>
  (debug ? 'https://develop.caseactive.net' : environment.MANAGE_API_URL) + '/v1/' + getHost() + path;

/**
 * Account API url.
 */
export const ACCOUNT_API_URL = (path = ''): string => environment.ACCOUNT_API_URL + '/v1/' + path;

/**
 * Application favicon.
 */
export const APP_FAVICON = (hostId: string): string => `${PUBLIC_CDN_URL}/hosts/${hostId}/favicon/images/favicon.png`;

/**
 * Hosts public CDN url.
 */
export const HOSTS_PUBLIC_CDN_URL = (path: string): string => PUBLIC_CDN_URL + '/hosts/' + getHost() + path;

/**
 * Hosts private CDN url.
 */
export const HOSTS_PRIVATE_CDN_URL = (path: string): string => environment.PRIVATE_CDN_URL + '/' + path;

/**
 * Private CDN url.
 */
export const PRIVATE_CDN_URL = (path: string): string => environment.PRIVATE_CDN_URL + '/hosts/' + getHost() + path;

/**
 * Options url for countries, time zones, languages, importance, plans, departments.
 */
export const OPTIONS_URL = (path: string, locale: string): string => '/opts/' + locale + path + '.json';

// to be removed
export const GET_DATA = (response: any): any => response.data;

////////////////////////////////////////////////////
/**
 * Gets user host.
 */
export function getHost(): string | null {
  const host = window.location.hostname;

  if (host.indexOf('.') < 0) {
    return null;
  } else {
    return host.split('.')[0];
  }
}

/**
 * Email & Phone number pattern.
 */
export function emailOrPhoneValidator(control: UntypedFormControl): { [key: string]: boolean } | null {
  const validPhoneRegexp = /^(?!0+$)(?:\(?\+\d{1,3}\)?[- ]?|0)?\d{10}$/;
  const emailRegexp =
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  if (control.value && !emailRegexp.test(control.value) && !validPhoneRegexp.test(control.value)) {
    return { invalidEmailOrPhoneValue: true };
  }
  return null;
}
