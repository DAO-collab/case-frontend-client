import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GuardService } from '../../services/guard.service';

import { MediaComponent } from './media/media.component';
import { OfficeComponent } from './office/office.component';
import { FormsComponent } from './forms/forms.component';
import { CreateDocFormComponent } from './forms/create-doc-form/create-doc-form.component';
import { SignsComponent } from './signs/signs.component';
import { DocSignsBuilderComponent } from './signs/doc-signs-builder/doc-signs-builder.component';
import { FormBuilderComponent } from './forms/form-builder/form-builder.component';
import { SignBuilderComponent } from './signs/sign-builder/sign-builder.component';
import { TasksComponent } from './tasks/tasks.component';

const routes: Routes = [
  {
    path: '',
    component: MediaComponent,
    canActivate: [GuardService]
  },
  {
    path: 'offices',
    component: OfficeComponent,
    canActivate: [GuardService]
  },
  {
    path: 'forms',
    component: FormsComponent,
    canActivate: [GuardService]
  },
  {
    path: 'forms/form-builder/:id',
    component: FormBuilderComponent,
    canActivate: [GuardService]
  },
  {
    path: 'forms/doc-form-builder',
    component: CreateDocFormComponent,
    canActivate: [GuardService]
  },
  {
    path: 'forms/doc-form-builder/:id',
    component: CreateDocFormComponent,
    canActivate: [GuardService]
  },
  {
    path: 'e-signs',
    component: SignsComponent,
    canActivate: [GuardService]
  },
  {
    path: 'e-signs/e-signs-builder/:id',
    component: SignBuilderComponent,
    canActivate: [GuardService]
  },
  {
    path: 'e-signs/doc-e-signs-builder',
    component: DocSignsBuilderComponent,
    canActivate: [GuardService]
  },
  {
    path: 'e-signs/doc-e-signs-builder/:id',
    component: DocSignsBuilderComponent,
    canActivate: [GuardService]
  },
  {
    path: 'tasks',
    component: TasksComponent,
    canActivate: [GuardService]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModulesRoutingModule {}
