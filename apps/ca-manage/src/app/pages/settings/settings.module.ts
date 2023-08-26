import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { ButtonComponent, ToggleComponent, CopyComponent } from '@ca/ui';

import { SlideToggleModule } from 'ngx-slide-toggle';
import { JoyrideModule } from 'ngx-joyride';

import { SettingsRoutingModule } from './settings-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { LogsComponent } from './logs/logs.component';
import { DesignSettingsComponent } from './design-settings/design-settings.component';
import { CaseformSettingsComponent } from './caseform-settings/caseform-settings.component';
import { UserformComponent } from './userform/userform.component';
import { ModuleSettingsComponent } from './module-settings/module-settings.component';
import { NotesComponent } from './notes/notes.component';
import { AddFieldModule } from '../../common/components/add-field/add-field.module';
import { AddFieldContentModule } from '../../common/components/add-field-content/add-field-content.module';
import { ActionsComponent } from './actions/actions.component';
import { CaseUserComponent } from './actions/case-user/case-user.component';
import { SettingsComponent } from './user-intake/settings/settings.component';
import { UserIntakeModalComponent } from './user-intake/user-intake-modal/user-intake-modal.component';
import { AfterActionsUsers } from './after-actions-users/after-actions-users.component';
import { AfterActionsCases } from './after-actions-cases/after-actions-cases.component';
import { AfterActionsTemplates } from './after-actions-templates/after-actions-templates.component';
import { ProfileInformationComponent } from './profile-information/profile-information.component';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';


@NgModule({
  imports: [
    CommonModule,
    SettingsRoutingModule,
    SharedModule,
    AddFieldModule,
    AddFieldContentModule,
    DragDropModule,
    SlideToggleModule,
    JoyrideModule.forChild(),
    ButtonComponent,
    ToggleComponent,
    CopyComponent,
    NgxIntlTelInputModule
  ],
  declarations: [
    DesignSettingsComponent,
    CaseformSettingsComponent,
    UserformComponent,
    LogsComponent,
    ModuleSettingsComponent,
    NotesComponent,
    ActionsComponent,
    CaseUserComponent,
    SettingsComponent,
    UserIntakeModalComponent,
    AfterActionsUsers,
    AfterActionsCases,
    AfterActionsTemplates,
    ProfileInformationComponent
  ]
})
export class SettingsModule {}
