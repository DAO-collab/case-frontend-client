import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MatFormioModule } from '@formio/angular-material/dist';
import { SlideToggleModule } from 'ngx-slide-toggle';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import {ToggleComponent, TimeSelectorComponent, LoadMoreComponent, ButtonComponent, DraggableFieldComponent} from '@ca/ui';

import { AlwaysAuthGuard } from '../../services/user.service';
import { SharedModule } from '../../shared/shared.module';
import { SignsComponent } from './signs/signs.component';
import { SignBuilderComponent } from './sign-builder/sign-builder.component';
import { CreateDocSignComponent } from './create-doc-sign/create-doc-sign.component';
import { SignSubmitComponent } from './sign-submit/sign-submit.component';
import { SignViewComponent } from './sign-view/sign-view.component';
import { CreateSignComponent } from './create-sign/create-sign.component';
import { SignPreviewComponent } from './sign-preview/sign-preview.component';
import { SubmitDocSignComponent } from './submit-doc-sign/submit-doc-sign.component';
import { DocSignPreviewComponent } from './doc-sign-preview/doc-sign-preview.component';
import { DocSignViewComponent } from './doc-sign-view/doc-sign-view.component';
import { DocSignUploaderComponent } from './doc-sign-uploader/doc-sign-uploader.component';
import { SignatureBoxModule } from '../../directives/component-directives/signature-box/signature-box.module';

const routes: Routes = [
  {
    path: '',
    component: SignsComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'e-sign-builder',
    component: SignBuilderComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'e-sign-builder/:id',
    component: SignBuilderComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'doc-e-sign-builder',
    component: CreateDocSignComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'doc-e-sign-builder/:id',
    component: CreateDocSignComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'e-sign-submit/:id',
    component: SignSubmitComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'e-sign-view/:id/:userId/:preview',
    component: SignViewComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'doc-e-sign-submit/:id',
    component: SubmitDocSignComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'doc-e-sign-view/:id/:userId/:preview',
    component: DocSignViewComponent,
    canActivate: [AlwaysAuthGuard]
  }
];

@NgModule({
  declarations: [
    SignsComponent,
    SignBuilderComponent,
    CreateDocSignComponent,
    SignSubmitComponent,
    SignViewComponent,
    CreateSignComponent,
    SignPreviewComponent,
    SubmitDocSignComponent,
    DocSignPreviewComponent,
    DocSignViewComponent,
    DocSignUploaderComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'options', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    ScrollingModule,
    MatFormioModule,
    AutocompleteLibModule,
    SlideToggleModule,
    SignatureBoxModule,
    ButtonComponent,
    ToggleComponent,
    TimeSelectorComponent,
    LoadMoreComponent,
    DraggableFieldComponent,
    DragDropModule
  ]
})
export class SignsModule {}
