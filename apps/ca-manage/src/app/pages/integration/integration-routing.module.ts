import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GuardService } from '../../services/guard.service';

import { ImportComponent } from './import/import.component';
import { ImportsComponent } from './imports/imports.component';
import { KeysComponent } from './keys/keys.component';
import { WebhooksComponent } from './webhooks/webhooks.component';

const routes: Routes = [
  {
    path: '',
    component: ImportsComponent,
    canActivate: [GuardService]
  },
  {
    path: 'webhooks',
    component: WebhooksComponent,
    canActivate: [GuardService]
  },
  {
    path: 'keys',
    component: KeysComponent,
    canActivate: [GuardService]
  },
  {
    path: 'import/view/:importId',
    component: ImportComponent,
    canActivate: [GuardService]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IntegrationRoutingModule {}
