import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorHandler, NgModule } from '@angular/core';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';

import { ButtonComponent, UtilsLibsService } from '@ca/ui';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import * as Sentry from '@sentry/angular-ivy';

import { AppComponent } from './app.component';

// Services
import { OptionsService } from './services/options.service';
import { StylesService } from './services/styles.service';
import { CasesService } from './services/cases.service';
import { UserService, AlwaysAuthGuard } from './services/user.service';
import { FeedsService } from './services/feeds.service';
import { CommentsService } from './services/comments.service';
import { RolesService } from './services/roles.service';
import { UtilsService } from './services/utils.service';
import { LocalTranslationService } from './services/local-translation.service';
import { LocationsService } from './services/locations.service';
import { EventsService } from './services/events.service';
import { TasksService } from './services/tasks.service';
import { GarbageCollectorService } from './services/garbage-collector.service';
import { FeedMediaService } from './services/feed-media.service';
import { FormsService } from './services/forms.service';
import { SignsService } from './services/signs.service';
import { DesignService } from './services/design.service';
import { ConfirmationPopUpService } from './services/confirmation-pop-up.service';
import { AppsService } from './services/apps.service';
import { HostService } from './services/host.service';
import { SchemaService } from './services/schema.service';

// Functions with independent functions for specific use
import { PrivateFilesHelperService } from './services/helpers/private-files-helper.service';

// Pipes
import { DatePipe } from '@angular/common';
import { FilterPipe } from './pipes/filter.pipe';

// Directives
import { PrivateFileDirective } from './directives/attribute-directives/private-file.directive';

// Components
import { PopInNotificationConnectorService } from './directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { PopInBoxComponent } from './directives/component-directives/pop-in-notifications/pop-in-box/pop-in-box.component';
import { HttpRequestsInterceptor } from './services/http.requests.interceptor';
import { CookieService } from 'ngx-cookie-service';
import { TimeValidatorDirective } from './shared/directives/time-validator.directive';
import { ServerErrorModalComponent } from './shared/components/server-error-modal/server-error-modal.component';
import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { FeedsComponent } from './pages/feeds/feeds/feeds.component';
import { AcceptInvitationModalComponent } from './shared/components/accept-invitation-modal/accept-invitation-modal.component';
import { NotificationsService } from './services/notifications.service';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { TodayPipe } from './pipes/today.pipe';
import { SafePipe } from './pipes/safe.pipe';
import { MentionsModule } from '@flxng/mentions';
import { TextFieldModule } from '@angular/cdk/text-field';
import { GlobalErrorHandler } from './services/chunk-loading-error.service';
import { ChunkLoadingErrorModalModule } from "../../../../libs/ui/src/lib/components/chunk-loading-error-modal/chunk-loading-error-modal.module";
import { ScrollTrackerDirective } from './directives/attribute-directives/scroll-tracker.directive';
import { FilterAttachmentsPipe } from './pages/feeds/feeds/pipes/filter-attachments.pipe';
import { ShowAttachmentsPipe } from './pages/feeds/feeds/pipes/show-attachments.pipe';


@NgModule({
  declarations: [
    AppComponent,
    FilterPipe,
    TimeAgoPipe,
    TodayPipe,
    SafePipe,
    PrivateFileDirective,
    PopInBoxComponent,
    TimeValidatorDirective,
    ServerErrorModalComponent,
    FeedsComponent,
    AcceptInvitationModalComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    SharedModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    MentionsModule,
    TextFieldModule,
    ChunkLoadingErrorModalModule,
    ButtonComponent,
    ScrollTrackerDirective,
    FilterAttachmentsPipe,
    ShowAttachmentsPipe
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpRequestsInterceptor,
      multi: true
    },
    AlwaysAuthGuard,
    CookieService,
    CasesService,
    DesignService,
    UserService,
    FeedsService,
    StylesService,
    FeedMediaService,
    RolesService,
    CommentsService,
    LocationsService,
    GarbageCollectorService,
    LocalTranslationService,
    PrivateFilesHelperService,
    ConfirmationPopUpService,
    PopInNotificationConnectorService,
    OptionsService,
    EventsService,
    FormsService,
    SignsService,
    TasksService,
    UtilsService,
    HttpClient,
    DatePipe,
    HostService,
    SchemaService,
    AppsService,
    NotificationsService,
    UtilsLibsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
