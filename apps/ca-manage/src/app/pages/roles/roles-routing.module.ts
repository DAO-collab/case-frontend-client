import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RolesComponent } from './roles.component';
import { AddRoleComponent } from './add-role/add-role.component';
import { EditRoleComponent } from './edit-role/edit-role.component';
import { GuardService } from '../../services/guard.service';

const routes: Routes = [
  {
    path: '',
    component: RolesComponent
  },
  {
    path: 'add',
    component: AddRoleComponent,
    canActivate: [GuardService],
    data: {
      workWithoutAuth: true
    }
  },
  {
    path: 'edit/:role_id',
    component: EditRoleComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RolesRoutingModule {}
