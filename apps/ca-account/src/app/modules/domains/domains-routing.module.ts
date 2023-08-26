import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DomainsComponent } from './domains.component';
import { EditDomainComponent } from './edit-domain/edit-domain.component';

const routes: Routes = [
  { path: '', component: DomainsComponent },
  { path: 'edit-domain/:id', component: EditDomainComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DomainsRoutingModule {}
