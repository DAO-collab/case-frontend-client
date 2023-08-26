import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ScrollingModule } from '@angular/cdk/scrolling';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SlideToggleModule } from 'ngx-slide-toggle';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { MatFormioModule } from '@formio/angular-material/dist';
import { PinchZoomModule } from 'ngx-pinch-zoom';
import { JoyrideModule } from 'ngx-joyride';
import { ToggleComponent, DraggableFieldComponent } from "@ca/ui";

import { IntakeFormsComponent } from './intake-forms.component';
import { IntakeFormsRoutingModule } from './intake-forms-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { AddFieldModule } from '../../../common/components/add-field/add-field.module';
import { AddFieldContentModule } from '../../../common/components/add-field-content/add-field-content.module';
import { CheckboxSelectModule } from '../../../common/components/checkbox-select/checkbox-select.module';
import { NotificationFieldModule } from '../../../common/components/notification-field/notification-field.module';
import { RruleModule } from '../../../common/components/rrule/rrule.module';
import { NumbersOnlyModule } from '../../../common/directives/numbers-only/numbers-only.module';
import { PopupfieldModule } from '../../../common/directives/popupfield/popupfield.module';
import { FormBuilderComponent } from './form-builder/form-builder.component';
import { FormPreviewComponent } from './form-preview/form-preview.component';
import { CreateDocFormComponent } from './create-doc-form/create-doc-form.component';
import { IntakeModalComponent } from './intake-modal/intake-modal.component';
import { DraggableFormFieldModule } from '../../../common/components/draggable-form-field/draggable-form-field.module';
import { DocIntakePreviewComponent } from './doc-intake-preview/doc-intake-preview.component';
import { DocIntakeUploaderComponent } from './doc-intake-uploader/doc-intake-uploader.component';

@NgModule({
  imports: [
    CommonModule,
    IntakeFormsRoutingModule,
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
    SharedModule,
    PinchZoomModule,
    JoyrideModule.forChild(),
    ToggleComponent,
    DraggableFieldComponent,
  ],
  declarations: [
    IntakeFormsComponent,
    FormBuilderComponent,
    FormPreviewComponent,
    CreateDocFormComponent,
    IntakeModalComponent,
    DocIntakePreviewComponent,
    DocIntakeUploaderComponent
  ]
})
export class IntakeFormsModule {}
