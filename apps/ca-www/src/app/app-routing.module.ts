import { NgModule } from '@angular/core';
import { RouterModule, Routes, ExtraOptions } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./views/home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'explore',
    loadChildren: () => import('./views/explore/explore.module').then(m => m.ExploreModule)
  },
  {
    path: 'howto',
    loadChildren: () => import('./views/howto/howto.module').then(m => m.HowtoModule)
  },
  {
    path: 'term-of-service',
    loadChildren: () => import('./views/term-of-service/term-of-service.module').then(m => m.TermOfServiceModule)
  },
  {
    path: 'pricing',
    loadChildren: () => import('./views/faq/faq.module').then(m => m.FaqModule)
  },
  {
    path: 'docs',
    loadChildren: () => import('./views/documentation/documentation.module').then(m => m.DocumentationModule)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled'
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
