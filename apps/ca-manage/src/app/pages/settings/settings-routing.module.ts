import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DesignSettingsComponent } from './design-settings/design-settings.component';
import { CaseformSettingsComponent } from './caseform-settings/caseform-settings.component';
import { LogsComponent } from './logs/logs.component';
import { UserformComponent } from './userform/userform.component';
import { ModuleSettingsComponent } from './module-settings/module-settings.component';
import { NotesComponent } from './notes/notes.component';
import { ActionsComponent } from './actions/actions.component';
import { RolesComponent } from '../roles/roles.component';
import { GuardService } from '../../services/guard.service';
import { SettingsComponent } from './user-intake/settings/settings.component';
import { AfterActionsUsers } from './after-actions-users/after-actions-users.component';
import { AfterActionsCases } from './after-actions-cases/after-actions-cases.component';
import { AfterActionsTemplates } from './after-actions-templates/after-actions-templates.component';
import { ProfileInformationComponent } from './profile-information/profile-information.component';

const routes: Routes = [
  {
    path: '',
    component: DesignSettingsComponent
  },
  {
    path: 'caseform',
    component: CaseformSettingsComponent,
    canActivate: [GuardService],
    data: {
      workWithoutAuth: true
    }
  },
  // CAM-10 HIde temporary
  // {
  //   path: 'logs',
  //   component: LogsComponent
  // },
  {
    path: 'userform',
    component: UserformComponent,
    canActivate: [GuardService],
    data: {
      workWithoutAuth: true
    }
  },
  {
    path: 'modules',
    component: ModuleSettingsComponent
  },
  {
    path: 'roles',
    component: RolesComponent
  },
  {
    path: 'profile-info',
    component: ProfileInformationComponent
  },
  {
    path: 'after-actions-users',
    component: AfterActionsUsers
  },
  {
    path: 'after-actions-templates',
    component: AfterActionsTemplates
  },
  {
    path: 'after-actions-cases',
    component: AfterActionsCases
  },
  {
    path: 'actions',
    component: ActionsComponent
  },
  {
    path: 'noteform',
    component: NotesComponent,
    canActivate: [GuardService],
    data: {
      workWithoutAuth: true
    }
  },
  {
    path: 'user-intake-settings',
    component: SettingsComponent
  },
  {
    path: 'intake-forms',
    loadChildren: () => import('../modules/intake-forms/intake-forms.module').then(m => m.IntakeFormsModule),
    canActivate: [GuardService]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule {}
