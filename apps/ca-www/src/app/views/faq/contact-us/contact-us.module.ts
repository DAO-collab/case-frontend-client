import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { ContactUsComponent } from './contact-us.component';
import { PipesModule } from '../../../common/pipes/pipes.module';

@NgModule({
  declarations: [ContactUsComponent],
  exports: [ContactUsComponent],
  imports: [
    CommonModule,
    NgSelectModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    ReactiveFormsModule,
    PipesModule
  ]
})
export class ContactUsModule {}
