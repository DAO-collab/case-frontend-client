import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgSelectModule } from '@ng-select/ng-select';
import { SlideToggleModule } from 'ngx-slide-toggle';
import {ToggleComponent} from "@ca/ui";

import { DomainsComponent } from './domains.component';
import { DomainsRoutingModule } from './domains-routing.module';
import { LoaderModule } from '../../common/components/loader/loader.module';
import { EditDomainComponent } from './edit-domain/edit-domain.component';

import { CaTranslateModule } from '../../common/components/translate/ca-translate.module';
import { ModalModule } from '../../common/components/modal/modal.module';

@NgModule({
  declarations: [DomainsComponent, EditDomainComponent],
  exports: [DomainsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    SlideToggleModule,
    NgSelectModule,
    CaTranslateModule,
    DomainsRoutingModule,
    LoaderModule,
    ModalModule,
    ToggleComponent
  ]
})
export class DomainsModule {}
