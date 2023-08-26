import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CasesComponent } from './cases.component';
import { CreateCaseComponent } from './create-case/create-case.component';
import { EditCaseComponent } from './edit-case/edit-case.component';
import { AssignToCaseComponent } from './assign-to-case/assign-to-case.component';
import { GuardService } from '../../services/guard.service';

const routes: Routes = [
  {
    path: '',
    component: CasesComponent
  },
  {
    path: 'create',
    component: CreateCaseComponent,
    canActivate: [GuardService],
    data: {
      workWithoutAuth: true
    }
  },
  {
    path: 'edit/:case_id',
    component: EditCaseComponent,
    canActivate: [GuardService],
    data: {
      workWithoutAuth: true
    }
  },
  {
    path: 'permissions/:case_id',
    component: AssignToCaseComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CasesRoutingModule {}
