import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ResizableModule } from 'angular-resizable-element';
import { MatFormioModule } from '@formio/angular-material/dist';
import { SharedModule } from '../../../shared/shared.module';
import { DraggableFormFieldComponent } from './draggable-form-field.component';
import { SlideToggleModule } from 'ngx-slide-toggle';
import {ToggleComponent} from '@ca/ui';

@NgModule({
  declarations: [DraggableFormFieldComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    SharedModule,
    SlideToggleModule,
    ResizableModule,
    MatFormioModule,
    ToggleComponent
  ],
  exports: [DraggableFormFieldComponent]
})
export class DraggableFormFieldModule {}
