import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Reset password component.
 */
@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  public loading = false;
  public resetRequestError: string[] = [];
  public emailOrPhone?: string;

  constructor(private router: Router, private authService: AuthService) {}

  /**
   * Sends email to the user with a recovery code.
   */
  public submit(): void {
    this.loading = true;
    this.resetRequestError = [];

    this.authService
      .resetPassword(this.emailOrPhone!)
      .pipe(
        catchError(res => {
          this.loading = false;
          this.resetRequestError = res.error && res.error.error && res.error.error.errors;
          return throwError(res.error);
        })
      )
      .subscribe(data => {
        this.loading = false;
        this.router.navigate(['reset-password-confirm/' + this.emailOrPhone], {
          queryParams: {
            username: this.emailOrPhone,
            message: data.message
          }
        });
      });
  }
}
