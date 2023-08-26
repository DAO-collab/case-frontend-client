import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CopyComponent } from '@ca/ui';
import { CasesRoutingModule } from './cases-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { NumberFieldModule } from '../../common/directives/number-field/number-field.module';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';

// Components
import { CasesComponent } from './cases.component';
import { CreateCaseComponent } from './create-case/create-case.component';
import { EditCaseComponent } from './edit-case/edit-case.component';
import { AssignToCaseComponent } from './assign-to-case/assign-to-case.component';

@NgModule({
    imports: [CommonModule, CasesRoutingModule, SharedModule, NumberFieldModule, CopyComponent, NgxIntlTelInputModule],
    declarations: [CasesComponent, CreateCaseComponent, EditCaseComponent, AssignToCaseComponent]
  })
export class CasesModule {}
