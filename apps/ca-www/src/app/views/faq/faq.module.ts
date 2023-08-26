import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FaqComponent } from './faq/faq.component';
import { SharedModule } from '@www/common/shared.module';
import { PricingComponent } from './pricing/pricing.component';
import { ContactUsModule } from './contact-us/contact-us.module';

const routes: Routes = [
  {
    path: '',
    component: FaqComponent
  }
];

@NgModule({
  declarations: [FaqComponent, PricingComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    NgSelectModule,
    SharedModule,
    ContactUsModule
  ]
})
export class FaqModule {}
