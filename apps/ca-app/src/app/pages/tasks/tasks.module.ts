import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { ButtonComponent, ToggleComponent, TimeSelectorComponent } from '@ca/ui';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AlwaysAuthGuard } from '../../services/user.service';
import { TasksComponent } from './tasks/tasks.component';
import { CreateTaskComponent } from './create-task/create-task.component';
import { SharedModule } from '../../shared/shared.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SlideToggleModule } from 'ngx-slide-toggle';

const routes: Routes = [
  {
    path: '',
    component: TasksComponent,
    canActivate: [AlwaysAuthGuard]
  }
];

@NgModule({
  declarations: [TasksComponent, CreateTaskComponent],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    FormsModule,
    RouterModule.forChild(routes),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'options', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    SharedModule,
    SlideToggleModule,
    ButtonComponent,
    ToggleComponent,
    TimeSelectorComponent
  ]
})
export class TasksModule {}
