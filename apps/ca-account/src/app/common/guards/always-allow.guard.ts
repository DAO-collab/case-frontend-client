import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

/**
 * Guard which allow user to use some routes when he is authenticated and when is not
 */

@Injectable({
  providedIn: 'root'
})
export class AlwaysAllowGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(_next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const { url, root } = state;

    this.authService.redirectUrl = url;

    return true;
  }
}
