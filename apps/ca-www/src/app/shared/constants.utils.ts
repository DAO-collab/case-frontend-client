/**
 * Email pattern.
 */
// tslint:disable-next-line: max-line-length
export const EMAIL_REG_EXP =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Password pattern.
 */
export const PASSWORD_REG_EXP = /(?=^.{8,}$)(?=.*\d)|(?=.*\W+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

/**
 * Popular languages to match.
 */
export const POPULAR_LANGUAGES = ['en', 'zh', 'es', 'hi', 'ar'];
