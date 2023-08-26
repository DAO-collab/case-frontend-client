import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ButtonComponent } from '@ca/ui';

import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';
import { JoyrideModule } from 'ngx-joyride';

import { AppRoutingModule } from '../app-routing.module';
import { MainComponent } from './main.component';
import { NavigationComponent } from './navigation/navigation.component';
import { FooterComponent } from './footer/footer.component';
import { ProfileModalComponent } from './profile-modal/profile-modal.component';

import { PopInNotificationsModule } from '../common/components/pop-in-notifications/pop-in-notifications.module';
import { ServerErrorModalModule } from '../common/components/server-error-modal/server-error-modal.module';
import { CaTranslateModule } from '../common/components/translate/ca-translate.module';
import { ModalModule } from '../common/components/modal/modal.module';
import { AcceptInvitationModalComponent } from '../modules/apps/accept-invitation-modal/accept-invitation-modal.component';
import { PipesModule } from '../common/pipes/pipes.module';
import { JoinAppModalComponent } from '../modules/apps/join-app-modal/join-app-modal.component';
import { DomainsModalComponent } from '../modules/domains/domains-modal/domains-modal.component';
import { LoaderModule } from '../common/components/loader/loader.module';
import { SelectOptionModalComponent } from '../modules/apps/select-option-modal/select-option-modal.component';
import { ChunkLoadingErrorModalModule } from "../../../../../libs/ui/src/lib/components/chunk-loading-error-modal/chunk-loading-error-modal.module";

@NgModule({
  declarations: [
    MainComponent,
    NavigationComponent,
    FooterComponent,
    ProfileModalComponent,
    AcceptInvitationModalComponent,
    JoinAppModalComponent,
    DomainsModalComponent,
    SelectOptionModalComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppRoutingModule,
    TranslateModule,
    PopInNotificationsModule,
    ServerErrorModalModule,
    NgSelectModule,
    CaTranslateModule,
    ModalModule,
    PipesModule,
    FormsModule,
    GooglePlaceModule,
    LoaderModule,
    JoyrideModule.forRoot(),
    ButtonComponent,
    ChunkLoadingErrorModalModule
  ],
  exports: [MainComponent, AppRoutingModule, GooglePlaceModule]
})
export class MainModule {}
