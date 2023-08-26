import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgSelectModule } from '@ng-select/ng-select';
import { InternationalPhoneNumberModule } from 'ngx-international-phone-number';

import { DashboardComponent } from './dashboard.component';
import { AlwaysAuthGuard } from '../../services/user.service';
import { ViewBroadcastModalComponent } from './view-broadcast-modal/view-broadcast-modal.component';
import { DashboardSearchComponent } from './dashboard-search/dashboard-search.component';
import { ViewTicketModalComponent } from './view-ticket-modal/view-ticket-modal.component';
import { CreateTicketModalComponent } from './create-ticket-modal/create-ticket-modal.component';
import { SharedModule } from '../../shared/shared.module';
import { SignatureBoxModule } from '../../directives/component-directives/signature-box/signature-box.module';

export const routes = [{ path: '', component: DashboardComponent, canActivate: [AlwaysAuthGuard] }];

@NgModule({
  declarations: [
    DashboardComponent,
    ViewBroadcastModalComponent,
    DashboardSearchComponent,
    ViewTicketModalComponent,
    CreateTicketModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'options', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    NgSelectModule,
    InternationalPhoneNumberModule,
    SharedModule,
    SignatureBoxModule
  ]
})
export class DashboardModule {}
