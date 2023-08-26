/**
 * Change Password Credentials model.
 */
export interface IPasswordChangeCredentials {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * Confirm Reset Password Credentials model.
 */
export interface IConfirmResetPasswordCredentials {
  username: string;
  code: string;
  new_password: string;
  confirmNewPassword: string;
}
