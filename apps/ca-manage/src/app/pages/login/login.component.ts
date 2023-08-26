import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { Router, RouterState } from '@angular/router';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  public vm: any = {};
  public environment = environment;
  public stateParams: RouterState = this.router.routerState;

  constructor(public adminService: AdminService, public router: Router) {}

  ngOnInit() {
    this.vm.loading = false;
    // this.vm.message = this.stateParams.message;
    this.vm.signInError = null;
    this.vm.title = 'loginCtrl';
    this.vm.user = {
      username: '',
      password: ''
    };
    if (this.adminService.isLoggedIn()) {
      this.router.navigate(['']);
    }

    this.vm.login = () => {
      this.vm.loading = true;
      this.adminService
        .login(this.vm.user.username, this.vm.user.password)
        .pipe(
          catchError(res => {
            if (res && res.data && res.data.error) {
              this.vm.signInError = res.data.error.errors;
            }
            this.vm.loading = false;
            return throwError(res.error);
          })
        )
        .subscribe(() => {
          this.vm.loading = false;
          this.router.navigate(['']);
        });
    };
  }
}
