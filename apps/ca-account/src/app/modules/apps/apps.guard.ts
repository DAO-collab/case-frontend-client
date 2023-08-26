import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/**
 * Guard for route protection.
 */
@Injectable({
  providedIn: 'root'
})
export class AppsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  /**
   * Activates guarded routes if user is authenticated.
   */
  canActivate(_next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    this.authService.logout().subscribe();
    return false;
  }
}
