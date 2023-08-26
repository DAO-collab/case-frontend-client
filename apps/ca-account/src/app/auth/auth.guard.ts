import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard for route protection.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Activates guarded routes if user is authenticated.
   */
  canActivate(_next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const { url, root } = state;

    return this.checkLogIn(url, root);
  }

  /**
   * Checks if user is authenticated.
   * Stores the attempted URL for redirecting.
   * Navigates to the sign in page with extras.
   */
  private checkLogIn(url: string, root: ActivatedRouteSnapshot) {
    this.authService.redirectUrl = url;
    this.authService.redirectApp = root.queryParams['redirectApp'];

    if (this.authService.isLoggedIn) {
      return true;
    }

    this.router.navigate(['login'], {
      queryParams: this.authService.redirectApp ? { redirectApp: this.authService.redirectApp } : { redirectUrl: url }
    });

    return false;
  }
}
