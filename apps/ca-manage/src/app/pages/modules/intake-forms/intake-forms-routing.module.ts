import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { GuardService } from '../../../services/guard.service';
import { IntakeFormsComponent } from './intake-forms.component';
import { CreateDocFormComponent } from './create-doc-form/create-doc-form.component';
import { FormBuilderComponent } from './form-builder/form-builder.component';

const routes: Routes = [
  { path: '', component: IntakeFormsComponent, canActivate: [GuardService] },
  { path: 'doc-form-builder/:id', component: CreateDocFormComponent, canActivate: [GuardService] },
  { path: 'form-builder/:id', component: FormBuilderComponent, canActivate: [GuardService] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IntakeFormsRoutingModule {}
