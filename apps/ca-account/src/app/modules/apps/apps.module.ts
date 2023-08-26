import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgSelectModule } from '@ng-select/ng-select';
import { JoyrideModule } from 'ngx-joyride';
import { ButtonComponent } from '@ca/ui';

import { AppsRoutingModule } from './apps-routing.module';
import { AppsComponent } from './apps.component';
import { LoaderModule } from '@acc/common/components/loader/loader.module';
import { CaTranslateModule } from '@acc/common/components/translate/ca-translate.module';
import { ErrorModule } from '@acc/common/components/error/error.module';
import { ModalModule } from '@acc/common/components/modal/modal.module';
import { CreateAppModalComponent } from './create-app-modal/create-app-modal.component';

@NgModule({
  declarations: [AppsComponent, CreateAppModalComponent],
  imports: [
    CommonModule,
    AppsRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    NgSelectModule,
    LoaderModule,
    CaTranslateModule,
    ErrorModule,
    ModalModule,
    JoyrideModule.forChild(),
    ButtonComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppsModule {}
