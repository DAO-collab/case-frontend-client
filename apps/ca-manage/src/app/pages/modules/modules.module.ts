import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResizableModule } from 'angular-resizable-element';

import { ModulesRoutingModule } from './modules-routing.module';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { SharedModule } from '../../shared/shared.module';

// Components
import { MediaComponent } from './media/media.component';
import { OfficeComponent } from './office/office.component';
import { SignsComponent } from './signs/signs.component';
import { DocSignsBuilderComponent } from './signs/doc-signs-builder/doc-signs-builder.component';
import { CreateDocFormComponent } from './forms/create-doc-form/create-doc-form.component';
import { FormsComponent } from './forms/forms.component';
import { ViewerComponent } from './media/viewer/viewer.component';
import { AudioJSComponent } from './media/viewer/audiojs-component/audiojs.component';
import { VideoJSComponent } from './media/viewer/videojs-component/videojs.component';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SlideToggleModule } from 'ngx-slide-toggle';
import { ButtonComponent, ToggleComponent, DraggableFieldComponent } from '@ca/ui';
import { PinchZoomModule } from 'ngx-pinch-zoom';
import { MatFormioModule } from '@formio/angular-material/dist';

import { AddFieldModule } from '../../common/components/add-field/add-field.module';
import { AddFieldContentModule } from '../../common/components/add-field-content/add-field-content.module';
import { CheckboxSelectModule } from '../../common/components/checkbox-select/checkbox-select.module';
import { NotificationFieldModule } from '../../common/components/notification-field/notification-field.module';
import { RruleModule } from '../../common/components/rrule/rrule.module';
import { FormModalComponent } from '../../common/components/form-modal/form-modal.component';

import { PopupfieldModule } from '../../common/directives/popupfield/popupfield.module';
import { NumbersOnlyModule } from '../../common/directives/numbers-only/numbers-only.module';
import { FormBuilderComponent } from './forms/form-builder/form-builder.component';
import { FormPreviewComponent } from './forms/form-preview/form-preview.component';
import { SignPreviewComponent } from './signs/sign-preview/sign-preview.component';
import { SignBuilderComponent } from './signs/sign-builder/sign-builder.component';
import { DocFormPreviewComponent } from './forms/doc-form-preview/doc-form-preview.component';
import { DraggableFormFieldModule } from '../../common/components/draggable-form-field/draggable-form-field.module';
import { DocSignPreviewComponent } from './signs/doc-sign-preview/doc-sign-preview.component';
import { DocFormUploaderComponent } from './forms/doc-form-uploader/doc-form-uploader.component';
import { DocSignUploaderComponent } from './signs/doc-sign-uploader/doc-sign-uploader.component';
import { TasksComponent } from './tasks/tasks.component';
import { PipesModule } from '../../common/pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    ModulesRoutingModule,
    DragDropModule,
    SharedModule,
    AddFieldModule,
    AddFieldContentModule,
    CheckboxSelectModule,
    DraggableFormFieldModule,
    NotificationFieldModule,
    RruleModule,
    NumbersOnlyModule,
    PopupfieldModule,
    ScrollingModule,
    SlideToggleModule,
    AutocompleteLibModule,
    MatFormioModule,
    PinchZoomModule,
    ResizableModule,
    PipesModule,
    ToggleComponent,
    ButtonComponent,
    DraggableFieldComponent,
  ],
  declarations: [
    MediaComponent,
    OfficeComponent,
    CreateDocFormComponent,
    DocSignsBuilderComponent,
    FormsComponent,
    SignsComponent,
    ViewerComponent,
    AudioJSComponent,
    VideoJSComponent,
    FormModalComponent,
    FormBuilderComponent,
    FormPreviewComponent,
    SignPreviewComponent,
    SignBuilderComponent,
    DocFormPreviewComponent,
    DocSignPreviewComponent,
    DocFormUploaderComponent,
    DocSignUploaderComponent,
    TasksComponent
  ]
})
export class ModulesModule {}
