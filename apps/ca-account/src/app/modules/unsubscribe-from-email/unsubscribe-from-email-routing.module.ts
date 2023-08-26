import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UnsubscribeFromEmailComponent } from './unsubscribe-from-email.component';

const routes: Routes = [{ path: '', component: UnsubscribeFromEmailComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UnsubscribeFromEmailRoutingModule {}
