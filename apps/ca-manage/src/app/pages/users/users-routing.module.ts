import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UsersComponent } from './users.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { GuardService } from '../../services/guard.service';
import { ViewCasesComponent } from './view-cases/view-cases.component';

const routes: Routes = [
  {
    path: '',
    component: UsersComponent
  },
  {
    path: 'edit/:user_id',
    component: EditUserComponent,
    canActivate: [GuardService],
    data: {
      workWithoutAuth: true
    }
  },
  {
    path: 'view/:user_id',
    component: EditUserComponent,
    canActivate: [GuardService],
    data: {
      workWithoutAuth: true
    }
  },
  {
    path: 'cases/:user_id',
    component: ViewCasesComponent,
    canActivate: [GuardService],
    data: {
      workWithoutAuth: true
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule {}
