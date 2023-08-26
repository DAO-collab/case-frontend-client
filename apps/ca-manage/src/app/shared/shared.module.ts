import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { PopoverModule } from 'ngx-bootstrap/popover';
import { DndModule } from 'ng2-dnd';
import { TranslateModule } from '@ngx-translate/core';
import { ColorPickerModule } from 'ngx-color-picker';
import { CookieModule } from 'ngx-cookie';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NgSelectModule } from '@ng-select/ng-select';
import { InternationalPhoneNumberModule } from 'ngx-international-phone-number';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';

// Google places
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';

// DATEPICKER
// import 'flatpickr/dist/flatpickr.css'; // you may need to adjust the css import depending on your build tool
import { FlatpickrModule } from 'angularx-flatpickr';
import * as flatpickr from 'flatpickr';

import { HttpRequestsInterceptor } from '../services/http.requests.interceptor';

import { ErrorModule } from '../common/components/error/error.module';
import { CheckboxSelectModule } from '../common/components/checkbox-select/checkbox-select.module';
import { LoaderModule } from '../common/components/loader/loader.module';
import { SpinnerModule } from '../common/components/spinner/spinner.module';
import { PipesModule } from '../common/pipes/pipes.module';
import { ConfirmationPopUpModule } from '../common/directives/confirmation-pop-up/confirmation-pop-up.module';
import { PrivateFileModule } from '../common/directives/private-file/private-file.module';
import { PopInNotificationsModule } from '../common/components/pop-in-notifications/pop-in-notifications.module';
import { AddUserModalComponent } from '../common/components/add-user-modal/add-user-modal.component';

@NgModule({
  imports: [
    GooglePlaceModule,
    CommonModule,
    FormsModule,
    PopoverModule.forRoot(),
    DndModule.forRoot(),
    NgSelectModule,
    TranslateModule,
    ColorPickerModule,
    ImageCropperModule,
    ReactiveFormsModule,
    PopInNotificationsModule,
    CookieModule.forRoot(),
    FlatpickrModule.forRoot(),
    InternationalPhoneNumberModule,
    CheckboxSelectModule,
    PipesModule,
    ConfirmationPopUpModule,
    PrivateFileModule,
    ErrorModule,
    NgxMaskDirective, 
    NgxMaskPipe,
    RouterModule,
    NgxIntlTelInputModule
  ],
  exports: [
    GooglePlaceModule,
    FormsModule,
    CookieModule,
    CommonModule,
    FlatpickrModule,
    ImageCropperModule,
    ReactiveFormsModule,
    PopInNotificationsModule,
    ColorPickerModule,
    TranslateModule,
    NgSelectModule,
    PopoverModule,
    DndModule,
    ErrorModule,
    LoaderModule,
    SpinnerModule,
    PipesModule,
    ConfirmationPopUpModule,
    PrivateFileModule,
    InternationalPhoneNumberModule,
    AddUserModalComponent,
  ],
  declarations: [AddUserModalComponent],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpRequestsInterceptor,
      multi: true
    },
    provideNgxMask()
  ]
})
export class SharedModule {}
