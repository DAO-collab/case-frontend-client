import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { SupportRoutingModule } from './support-routing.module';
import { SupportComponent } from './support.component';
import { SupportThanksComponent } from './support-thanks/support-thanks.component';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { CaTranslateModule } from '@acc/common/components/translate/ca-translate.module';
import { ErrorModule } from '@acc/common/components/error/error.module';

@NgModule({
  declarations: [SupportComponent, SupportThanksComponent],
  imports: [
    CommonModule,
    SupportRoutingModule,
    ReactiveFormsModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    CaTranslateModule,
    ErrorModule
  ]
})
export class SupportModule {}
