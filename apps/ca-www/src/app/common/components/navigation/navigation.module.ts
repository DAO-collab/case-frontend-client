import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

import { NavigationComponent } from './navigation.component';
import { SelectLanguageModule } from '../../components/select-language/select-language.module';
import { ScrollNavModule } from '../../directives/scroll-nav/scroll-nav.module';
import { MobileMenuModule } from '../../directives/mobile-menu/mobile-menu.module';

@NgModule({
  declarations: [NavigationComponent],
  imports: [CommonModule, RouterModule, TranslateModule, SelectLanguageModule, ScrollNavModule, MobileMenuModule],
  exports: [NavigationComponent]
})
export class NavigationModule {}
