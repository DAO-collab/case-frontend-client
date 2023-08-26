import { BrowserModule } from '@angular/platform-browser';
import { SharedModule } from './shared/shared.module';
import { ErrorHandler, NgModule } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { JoyrideModule } from 'ngx-joyride';

import { ButtonComponent } from '@ca/ui';

import * as Sentry from '@sentry/angular-ivy';

import { RoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Components
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

// Services
import { AdminService } from './services/admin.service';
import { DriveService } from './services/drive.service';
import { UtilsService } from './services/utils.service';
import { CasesService } from './pages/cases/services/cases.service';
import { UsersService } from './pages/users/services/users.service';
import { RolesService } from './pages/roles/services/roles.service';
import { OptionsService } from './services/options.service';
import { LocationsService } from './services/locations.service';
import { AppsService } from './services/apps.service';
import { LocalTranslationService } from './services/local-translation.service';
import { AmazonService } from './services/amazon.service';
import { DesignService } from './services/design.service';
import { FormsService } from './services/forms.service';
import { SignsService } from './services/signs.service';
import { HostService } from './services/host.service';
import { CookieService } from 'ngx-cookie-service';
import { PrivateFilesHelperService } from './services/helpers/private-files-helper.service';
import { ConfirmationPopUpService } from './services/confirmation-pop-up.service';
import { FeedMediaService } from './services/feed-media.service';
import { ContentMediaService } from './services/content-media.service';
import { GuardService } from './services/guard.service';
import { ImportsService } from './pages/integration/services/imports.service';
import { KeysService } from './pages/integration/services/keys.service';
import { WebhooksService } from './pages/integration/services/webhooks.service';

import { PopInNotificationConnectorService } from './common/components/pop-in-notifications/pop-in-notification-connector.service';
import { ServerErrorModalModule } from './common/components/server-error-modal/server-error-modal.module';
import { AcceptInvitationModalComponent } from './common/components/accept-invitation-modal/accept-invitation-modal.component';
import { NotificationsService } from './services/notifications.service';
import { PaymentErrorModalComponent } from './common/components/payment-error-modal/payment-error-modal.component';
import { TourComponent } from './common/components/tour/tour.component';
import { ChunkLoadingErrorModalModule } from './../../../../libs/ui/src/lib/components/chunk-loading-error-modal/chunk-loading-error-modal.module';
import { GlobalErrorHandler } from './services/chunk-loading-error.service';


@NgModule({
  declarations: [
    AppComponent,
    NotFoundComponent,
    DashboardComponent,
    LoginComponent,
    AcceptInvitationModalComponent,
    PaymentErrorModalComponent,
    TourComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    SharedModule,
    RoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    ServerErrorModalModule,
    CdkAccordionModule,
    JoyrideModule.forRoot(),
    ButtonComponent,
    ChunkLoadingErrorModalModule
  ],
  providers: [
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({ showDialog: false })
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },
    DatePipe,
    AdminService,
    UtilsService,
    CookieService,
    CasesService,
    UsersService,
    ImportsService,
    KeysService,
    WebhooksService,
    RolesService,
    LocationsService,
    AppsService,
    OptionsService,
    LocalTranslationService,
    PrivateFilesHelperService,
    ConfirmationPopUpService,
    PopInNotificationConnectorService,
    ContentMediaService,
    FeedMediaService,
    GuardService,
    AmazonService,
    DesignService,
    DriveService,
    FormsService,
    SignsService,
    HostService,
    NotificationsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
