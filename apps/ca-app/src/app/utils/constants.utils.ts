import { environment } from '../../environments/environment';

/**
 * User host name.
 */
const hostname = location.hostname.split('.')[0];

/**
 * API url.
 */
export const API_URL = `${environment.APP_API_URL}/v1/${hostname}`;

/**
 * API url.
 */
export const MANAGE_API_URL = `${environment.MANAGE_API_URL}/v1/${hostname}`;

/**
 * Hosts public CDN url.
 */
export const { ACCOUNT_CLIENT_URL, PRIVATE_CDN_URL, PUBLIC_CDN_URL } = environment;

/**
 * Admin CDN url.
 */
export const ADMIN_CDN_URL = 'https://develop-api-cdn.caseactive.net';

/**
 * Host CDN url.
 */
export const HOST_CDN_URL = (path: string): string => PUBLIC_CDN_URL + '/hosts/' + hostname + path;

/**
 * Account API url.
 */
export const ACCOUNT_API_URL = (path = ''): string => environment.ACCOUNT_API_URL + '/v1/' + path;

/**
 * Application favicon.
 */
export const APP_FAVICON = (hostId: string): string => `${PUBLIC_CDN_URL}/hosts/${hostId}/favicon/images/favicon.png`;

export const OPTIONS_URL = (path: string, locale: string) => 'opts/' + locale + path + '.json';
