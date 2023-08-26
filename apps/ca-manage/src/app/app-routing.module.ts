import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Services
import { GuardService } from './services/guard.service';

// Components
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

// Routes configuration
const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [GuardService]
  },
  {
    path: 'announcements',
    loadChildren: () => import('./pages/announcements/announcements.module').then(m => m.AnnouncementsModule),
    canActivate: [GuardService]
  },
  {
    path: 'support',
    loadChildren: () => import('./pages/support/support.module').then(m => m.SupportModule),
    canActivate: [GuardService]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'users',
    loadChildren: () => import('./pages/users/users.module').then(m => m.UsersModule),
    canActivate: [GuardService]
  },
  {
    path: 'roles',
    loadChildren: () => import('./pages/roles/roles.module').then(m => m.RolesModule),
    canActivate: [GuardService]
  },
  {
    path: 'settings',
    loadChildren: () => import('./pages/settings/settings.module').then(m => m.SettingsModule),
    canActivate: [GuardService]
  },
  {
    path: 'cases',
    loadChildren: () => import('./pages/cases/cases.module').then(m => m.CasesModule),
    canActivate: [GuardService]
  },
  {
    path: 'integration',
    loadChildren: () => import('./pages/integration/integration.module').then(m => m.IntegrationModule),
    canActivate: [GuardService]
  },
  {
    path: 'library',
    loadChildren: () => import('./pages/modules/modules.module').then(m => m.ModulesModule),
    canActivate: [GuardService]
  },
  {
    path: 'invoices',
    loadChildren: () => import('./pages/payments/payments.module').then(m => m.PagesModule),
    canActivate: [GuardService]
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
    canActivate: [GuardService]
  },
  {
    path: '**',
    redirectTo: '/not-found'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [],
  declarations: []
})
export class RoutingModule {}
