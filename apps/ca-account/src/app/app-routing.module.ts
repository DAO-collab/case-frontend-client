import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './auth/auth.guard';
import { AppsGuard } from './modules/apps/apps.guard';
import { AlwaysAllowGuard } from './common/guards/always-allow.guard';

// Routes configuration
const routes: Routes = [
  {
    path: '',
    redirectTo: 'apps',
    pathMatch: 'full'
  },
  {
    path: 'support',
    loadChildren: () => import('./modules/support/support.module').then(m => m.SupportModule),
    canActivate: [AlwaysAllowGuard]
  },

  {
    path: 'apps/logout',
    loadChildren: () => import('./modules/apps/apps.module').then(m => m.AppsModule),
    canActivate: [AppsGuard]
  },

  {
    path: 'apps',
    loadChildren: () => import('./modules/apps/apps.module').then(m => m.AppsModule),
    canActivate: [AuthGuard]
  },

  {
    path: 'apps/:id',
    loadChildren: () => import('./modules/apps/apps.module').then(m => m.AppsModule),
    canActivate: [AuthGuard]
  },

  {
    path: 'account',
    redirectTo: 'account/contact'
  },

  {
    path: 'profile',
    loadChildren: () => import('./modules/profile/profile.module').then(m => m.ProfileModule),
    canActivate: [AuthGuard]
  },

  {
    path: 'unsubscribe_email',
    loadChildren: () =>
      import('./modules/unsubscribe-from-email/unsubscribe-from-email.module').then(m => m.UnsubscribeFromEmailModule),
    canActivate: [AlwaysAllowGuard]
  },

  {
    path: 'domains',
    loadChildren: () => import('./modules/domains/domains.module').then(m => m.DomainsModule),
    canActivate: [AuthGuard]
  },

  {
    path: 'sso/:id',
    loadChildren: () => import('./modules/sso/sso.module').then(m => m.SsoModule),
    canActivate: [AlwaysAllowGuard]
  },

  {
    path: '**',
    redirectTo: 'apps'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
