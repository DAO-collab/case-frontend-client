import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { ButtonComponent, ToggleComponent, TimeSelectorComponent, LoadMoreComponent } from '@ca/ui';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SlideToggleModule } from 'ngx-slide-toggle';

import { AlwaysAuthGuard } from '../../services/user.service';
import { SharedModule } from '../../shared/shared.module';
import { InvoiceComponent } from './invoice/invoice.component';
import { InvoiceCreateComponent } from './invoice-create/invoice-create.component';
import { InvoiceBuilderComponent } from './invoice-builder/invoice-builder.component';
import { ResizableTextAreaDirective } from './directives/text-area-resize.directive';
import { InvoicePreviewComponent } from './invoice-preview/invoice-preview.component';
import { InvoiceSubmitComponent } from './invoice-submit/invoice-submit.component';

const routes: Routes = [
  {
    path: '',
    component: InvoiceComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'invoice-builder/:id',
    component: InvoiceBuilderComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'invoice-submit/:id',
    component: InvoiceSubmitComponent,
    canActivate: [AlwaysAuthGuard]
  }
];

@NgModule({
  declarations: [
    InvoiceComponent,
    InvoiceCreateComponent,
    InvoiceBuilderComponent,
    ResizableTextAreaDirective,
    InvoicePreviewComponent,
    InvoiceSubmitComponent
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
    SlideToggleModule,
    ReactiveFormsModule,
    ButtonComponent,
    ToggleComponent,
    TimeSelectorComponent,
    LoadMoreComponent
  ]
})
export class InvoiceModule {}
