import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { CreateAppRoutingModule } from './create-app-routing.module';

import { CreateAppComponent } from './create-app.component';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgSelectModule } from '@ng-select/ng-select';

import { CaTranslateModule } from '@acc/common/components/translate/ca-translate.module';
import { ErrorModule } from '@acc/common/components/error/error.module';
import { LoaderModule } from '@acc/common/components/loader/loader.module';

@NgModule({
  declarations: [CreateAppComponent],
  imports: [
    CommonModule,
    CreateAppRoutingModule,
    ReactiveFormsModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    NgSelectModule,
    CaTranslateModule,
    ErrorModule,
    LoaderModule,
    FormsModule
  ]
})
export class CreateAppModule {}
