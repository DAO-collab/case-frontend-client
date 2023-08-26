import { NgModule } from '@angular/core';
import { ResizableModule } from 'angular-resizable-element';

import { CheckboxSelectComponent } from '../directives/component-directives/checkbox-select/checkbox-select.component';
import { ViewerComponent } from '../directives/component-directives/viewer/viewer.component';
import { VideoJSComponent } from '../directives/component-directives/viewer/videojs-component/videojs.component';
import { AudioJSComponent } from '../directives/component-directives/viewer/audiojs-component/audiojs.component';
import { LoaderComponent } from '../directives/loader/loader.component';
import { SpinnerComponent } from '../directives/spinner/spinner.component';
import { ErrorComponent } from '../directives/component-directives/error.component';

// DATEPICKER
// import 'flatpickr/dist/flatpickr.css'; // you may need to adjust the css import depending on your build tool
import { FlatpickrModule } from 'angularx-flatpickr';
// TimePicker
import { RruleComponent } from '../directives/component-directives/rrule/rrule.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PinchZoomModule } from 'ngx-pinch-zoom';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';
import { SlideToggleModule } from 'ngx-slide-toggle';
import { SwiperModule } from 'swiper/angular';
import { MatFormioModule } from '@formio/angular-material/dist';
import {ToggleComponent} from "@ca/ui";

import { NotificationFieldComponent } from '../directives/component-directives/notification-field/notification-field.component';
import { ConfirmationPopUpDirective } from '../directives/attribute-directives/confirmation-pop-up.directive';
import { MediaViewComponent } from '../directives/component-directives/media-view/media-view.component';
import { AnswersViewComponent } from './components/answers-view/answers-view.component';
import { DndModule } from 'ng2-dnd';
// import { DraggableFieldComponent } from '../directives/component-directives/draggable-field/draggable-field.component';
import { FormFieldSelectorComponent } from './components/form-field-selector/form-field-selector.component';
import { NumberDirective } from './directives/numbers-only-directive';
import { SchemaComponent } from './components/schema/schema.component';
import { LongPressDirective } from './directives/long-press-directive';
import { DraggableFormFieldComponent } from '../directives/component-directives/draggable-form-field/draggable-form-field.component';
import { TimePipe } from '../pipes/time.pipe';
import { SvgIconComponent } from './components/svg-icon/svg-icon.component';
import { PublishPopUpDirective } from '../directives/attribute-directives/publish-pop-up.directive';
import { MainPageLoaderComponent } from './components/main-page-loader/main-page-loader.component';
import { NoPermissionToCaseModalComponent } from './components/no-permission-to-case-modal/no-permission-to-case-modal.component';

@NgModule({
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    FlatpickrModule.forRoot(),
    NgSelectModule,
    GooglePlaceModule,
    DndModule.forRoot(),
    PinchZoomModule,
    SlideToggleModule,
    ResizableModule,
    SwiperModule,
    MatFormioModule,
    ToggleComponent
  ],
  exports: [
    CheckboxSelectComponent,
    VideoJSComponent,
    ViewerComponent,
    AudioJSComponent,
    LoaderComponent,
    SpinnerComponent,
    ErrorComponent,
    FlatpickrModule,
    RruleComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgSelectModule,
    GooglePlaceModule,
    NotificationFieldComponent,
    ConfirmationPopUpDirective,
    PublishPopUpDirective,
    MediaViewComponent,
    AnswersViewComponent,
    SvgIconComponent,
    DndModule,
    // DraggableFieldComponent,
    DraggableFormFieldComponent,
    FormFieldSelectorComponent,
    NumberDirective,
    LongPressDirective,
    SchemaComponent,
    PinchZoomModule,
    MainPageLoaderComponent,
    NoPermissionToCaseModalComponent
  ],
  declarations: [
    CheckboxSelectComponent,
    VideoJSComponent,
    ViewerComponent,
    AudioJSComponent,
    LoaderComponent,
    SpinnerComponent,
    ErrorComponent,
    RruleComponent,
    NotificationFieldComponent,
    ConfirmationPopUpDirective,
    PublishPopUpDirective,
    MediaViewComponent,
    AnswersViewComponent,
    // DraggableFieldComponent,
    DraggableFormFieldComponent,
    FormFieldSelectorComponent,
    SvgIconComponent,
    NumberDirective,
    LongPressDirective,
    SchemaComponent,
    TimePipe,
    MainPageLoaderComponent,
    NoPermissionToCaseModalComponent
  ],
  providers: []
})
export class SharedModule {}
