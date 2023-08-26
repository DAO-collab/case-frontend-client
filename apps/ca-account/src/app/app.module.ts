import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorHandler, NgModule } from '@angular/core';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';

import * as Sentry from '@sentry/angular-ivy';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RecaptchaV3Module, RECAPTCHA_V3_SITE_KEY, ReCaptchaV3Service } from 'ng-recaptcha';
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';

// Services
import { CookieService } from 'ngx-cookie-service';
import { HttpRService } from './services/http-r.service';
import { HttpResponse } from './services/http-r.service';
import { AppComponent } from './app.component';
import { HttpRequestsInterceptor } from './core/http.requests.interceptor';
import { environment } from '@acc-envs/environment';
import { AuthModule } from './auth/auth.module';
import { MainModule } from './main/main.module';
import { CacheInterceptor } from './core/cache/cache.interceptor';
import { LoaderModule } from './common/components/loader/loader.module';
import { NotificationsService } from './services/notifications.service';
import { GlobalErrorHandler } from './services/chunk-loading-error.service';

@NgModule({
  declarations: [AppComponent],
  imports: [
    GooglePlaceModule,
    BrowserModule,
    NgbModule,
    HttpClientModule,
    RecaptchaV3Module,
    BrowserAnimationsModule,
    ScrollToModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    AuthModule,
    MainModule,
    LoaderModule
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CacheInterceptor,
      multi: true
    },
    CookieService,
    HttpRService,
    HttpResponse,
    ReCaptchaV3Service,
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.RECAPTCHA_KEY
    },
    NotificationsService
  ],
  exports: [RecaptchaV3Module, GooglePlaceModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
