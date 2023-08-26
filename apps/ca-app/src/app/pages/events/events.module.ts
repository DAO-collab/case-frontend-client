import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ButtonComponent, LoadMoreComponent, TimeSelectorComponent } from '@ca/ui';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';

import { AlwaysAuthGuard } from '../../services/user.service';
import { SharedModule } from '../../shared/shared.module';
import { EventsComponent } from './events/events.component';
import { EventCreateComponent } from './event-create/event-create.component';
import { EventViewComponent } from './event-view/event-view.component';
import { EnterTheViewportNotifierDirective } from '@app/directives/attribute-directives/enter-the-viewport-notifier.directive';

const routes: Routes = [
  {
    path: '',
    component: EventsComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'create',
    component: EventCreateComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'edit/:id',
    component: EventCreateComponent,
    canActivate: [AlwaysAuthGuard]
  }
];

@NgModule({
  declarations: [EventsComponent, EventCreateComponent, EventViewComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'options', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    ButtonComponent,
    TimeSelectorComponent,
    LoadMoreComponent,
    EnterTheViewportNotifierDirective
  ]
})
export class EventsModule {}
