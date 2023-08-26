import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SupportComponent } from './support.component';
import { SupportThanksComponent } from './support-thanks/support-thanks.component';

const routes: Routes = [
  { path: '', component: SupportComponent },
  { path: 'confirm-support', component: SupportThanksComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SupportRoutingModule {}
