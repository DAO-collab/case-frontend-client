import { environment } from '../../environments/environment';

/**
 * Get account api url.
 */
export const GET_API_URL = (path = ''): string => environment.ACCOUNT_API_URL + path;

/**
 * Gets account client url.
 */
export const GET_ACCOUNT_CLIENT_URL = (path = ''): string => environment.ACCOUNT_CLIENT_URL + path;

/**
 * Gets option url.
 */
export const GET_OPTIONS_URL = (path: string, locale: string): string => '/opts/' + locale + path + '.json';

/**
 * Gets logo.
 */
export const GET_LOGO = (): string => `${environment.PUBLIC_CDN_URL}/hosts/ca-main/logo/images/logo.png`;
