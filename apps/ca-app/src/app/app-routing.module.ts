import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { FeedsComponent } from './pages/feeds/feeds/feeds.component';
import { AlwaysAuthGuard } from './services/user.service';
import { NotFoundComponent } from './pages/not-found/not-found.component';

const routes: Route[] = [
  {
    path: '',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'feed',
    component: FeedsComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'events',
    loadChildren: () => import('./pages/events/events.module').then(m => m.EventsModule)
  },
  {
    path: 'media',
    loadChildren: () => import('./pages/media/media.module').then(m => m.MediaModule)
  },
  {
    path: 'forms',
    loadChildren: () => import('./pages/forms/form.module').then(m => m.FormModule)
  },
  {
    path: 'e-signs',
    loadChildren: () => import('./pages/signs/signs.module').then(m => m.SignsModule)
  },
  {
    path: 'intake-forms',
    loadChildren: () => import('./pages/intakes/intakes.module').then(m => m.IntakesModule)
  },
  {
    path: 'invoices',
    loadChildren: () => import('./pages/invoice/invoice.module').then(m => m.InvoiceModule)
  },
  {
    path: 'tasks',
    loadChildren: () => import('./pages/tasks/tasks.module').then(m => m.TasksModule)
  },
  {
    path: 'notes',
    loadChildren: () => import('./pages/notes/notes.module').then(m => m.NotesModule)
  },
  {
    path: 'convos',
    loadChildren: () => import('./pages/convo/convo.module').then(m => m.ConvoModule)
  },
  {
    path: 'info',
    loadChildren: () => import('./pages/info/info.module').then(m => m.InfoModule)
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: '**',
    redirectTo: '/not-found'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
