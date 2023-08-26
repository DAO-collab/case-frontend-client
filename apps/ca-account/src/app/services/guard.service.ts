import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from './user.service';
import { HttpRService } from './http-r.service';
import { UtilsService } from './utils.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class GuardService implements CanActivate {
  public userLogged = false;
  private subscribers: any[] = [];
  public userData;

  constructor(private adminService: UserService, private utilsService: UtilsService, private httpR: HttpRService) {}

  private destroySubscribers(): void {
    this.subscribers.forEach(s => s.unsubscribe());
  }

  public canActivate(): Promise<boolean> {
    this.utilsService.toggleHtmlBg(false);

    return new Promise(resolve => {
      // this.httpR.iframeloadedObserver.subscribe(() => {
      this.adminService
        .getProfile()
        .then(res => {
          resolve(true);
          this.userData = res.data;
          this.userLogged = true;
        })
        .catch(err => {
          resolve(false);
        });

      this.destroySubscribers();
      // });

      // this.httpR.addIframe();

      // this.adminService.getProfile().then(res => {
      //   resolve(true);
      //   this.userData = res.data;
      //   this.userLogged = true;
      // }).catch(err => {
      //   resolve(false);
      // });
    });
  }
}

@Injectable()
export class CheckNonLoggedService implements CanActivate {
  constructor(private adminService: UserService) {}

  public canActivate(): Promise<boolean> {
    return new Promise(resolve => {
      this.adminService
        .loginTry()
        .then(res => {
          resolve(true);
        })
        .catch(() => {
          resolve(true);
        });
    });
  }
}

@Injectable()
export class LogoutService implements CanActivate {
  constructor(
    private adminService: UserService,
    private router: Router,
    private guardService: GuardService,
    private authService: AuthService
  ) {}

  public canActivate(): Promise<boolean> {
    return new Promise(resolve => {
      // temporary fix
      this.authService.logout().subscribe(
        _res => {
          resolve(true);
          this.router.navigate(['login']);
          this.guardService.userLogged = false;
        },
        () => {
          resolve(false);
        }
      );
    });
  }
}
