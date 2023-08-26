import { NgModule } from '@angular/core';
import { NotesComponent } from './notes/notes.component';
import { Routes, RouterModule } from '@angular/router';
import { ButtonComponent, LoadMoreComponent } from '@ca/ui';
import { AlwaysAuthGuard } from '../../services/user.service';
import { CreateNoteComponent } from './create-note/create-note.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: NotesComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'create',
    component: CreateNoteComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'edit/:id',
    component: CreateNoteComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'view/:id',
    component: CreateNoteComponent,
    canActivate: [AlwaysAuthGuard],
    data: {
      viewOnly: true
    }
  }
];

@NgModule({
  declarations: [NotesComponent, CreateNoteComponent],
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
    LoadMoreComponent
  ]
})
export class NotesModule {}
