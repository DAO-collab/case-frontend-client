import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Routes, RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SlideToggleModule } from 'ngx-slide-toggle';
import { MatFormioModule } from '@formio/angular-material/dist';
import { ResizableModule } from 'angular-resizable-element';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';

import { ButtonComponent, ToggleComponent, TimeSelectorComponent, LoadMoreComponent, DraggableFieldComponent } from '@ca/ui';

import { AlwaysAuthGuard } from '../../services/user.service';
import { SharedModule } from '../../shared/shared.module';
import { FormsComponent } from './forms/forms.component';
import { CreateDocFormComponent } from './doc-form-builder/create-doc-form.component';
import { FormSubmitComponent } from './form-submit/form-submit.component';
import { FormViewComponent } from './form-view/form-view.component';
import { CreateFormComponent } from './create-form/create-form.component';
import { FormBuilderComponent } from './form-builder/form-builder.component';
import { FormPreviewComponent } from './form-preview/form-preview.component';
import { SubmitDocFormComponent } from './submit-doc-form/submit-doc-form.component';
import { DocFormPreviewComponent } from './doc-form-preview/doc-form-preview.component';
import { DocFormViewComponent } from './doc-form-view/doc-form-view.component';
import { DocFormUploaderComponent } from './doc-form-uploader/doc-form-uploader.component';
import { SignatureBoxModule } from '../../directives/component-directives/signature-box/signature-box.module';

const routes: Routes = [
  {
    path: '',
    component: FormsComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'simple-form-builder',
    component: FormBuilderComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'simple-form-builder/:id',
    component: FormBuilderComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'doc-form-builder',
    component: CreateDocFormComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'doc-form-builder/:id',
    component: CreateDocFormComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'form-builder/:id',
    component: FormBuilderComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'form-submit/:id',
    component: FormSubmitComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'form-view/:id/:userId/:preview',
    component: FormViewComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'doc-form-submit/:id',
    component: SubmitDocFormComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'doc-form-view/:id/:userId/:preview',
    component: DocFormViewComponent,
    canActivate: [AlwaysAuthGuard]
  }
];

@NgModule({
  declarations: [
    FormsComponent,
    FormBuilderComponent,
    CreateDocFormComponent,
    FormSubmitComponent,
    FormViewComponent,
    CreateFormComponent,
    FormBuilderComponent,
    FormPreviewComponent,
    SubmitDocFormComponent,
    DocFormPreviewComponent,
    DocFormViewComponent,
    DocFormUploaderComponent
  ],
  exports: [FormPreviewComponent, FormPreviewComponent],
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    ResizableModule,
    AutocompleteLibModule,
    RouterModule.forChild(routes),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'options', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    ScrollingModule,
    SlideToggleModule,
    MatFormioModule,
    SignatureBoxModule,
    DragDropModule,
    MatTooltipModule,
    ButtonComponent,
    ToggleComponent,
    TimeSelectorComponent,
    LoadMoreComponent,
    DraggableFieldComponent,
  ]
})
export class FormModule {}
