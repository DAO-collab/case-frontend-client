import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { HttpClient } from '@angular/common/http';

import {ToggleComponent} from "@ca/ui";

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SlideToggleModule } from 'ngx-slide-toggle';
import { ResizableModule } from 'angular-resizable-element';
import { MatFormioModule } from '@formio/angular-material/dist';

import { IntakesSubmitComponent } from './intakes-submit/intakes-submit.component';
import { AlwaysAuthGuard } from '../../services/user.service';
import { SharedModule } from '../../shared/shared.module';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { TimePipe } from '../../pipes/time.pipe';
import { IntakeFormPreviewComponent } from './intake-form-preview/intake-form-preview.component';

const routes: Routes = [
  {
    path: '',
    component: IntakesSubmitComponent,
    canActivate: [AlwaysAuthGuard]
  }
];

@NgModule({
  declarations: [IntakesSubmitComponent, IntakeFormPreviewComponent],
  providers: [TimePipe],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    ResizableModule,
    AutocompleteLibModule,
    RouterModule.forChild(routes),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'options', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    ScrollingModule,
    SlideToggleModule,
    MatFormioModule,
    ToggleComponent
  ]
})
export class IntakesModule {}
