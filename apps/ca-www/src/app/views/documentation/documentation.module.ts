import { NgModule, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { NgSelectModule } from '@ng-select/ng-select';
import {MultiTranslateHttpLoader} from 'ngx-translate-multi-http-loader';

import { DocumentationComponent } from './documentation/documentation.component';
import { DocsPreviewComponent } from './docs-preview/docs-preview.component';
import { ContactUsModule } from '../faq/contact-us/contact-us.module';
import { routes } from '@www-src/assets/markdowns/routes.js';

@NgModule({
  declarations: [
    DocumentationComponent,
    DocsPreviewComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    MarkdownModule.forRoot({ loader: HttpClient, sanitize: SecurityContext.NONE }),
    RouterModule.forChild(routes),
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        // useFactory: HttpLoaderFactory,
        useFactory: (http: HttpClient) => new MultiTranslateHttpLoader(http,
          [{prefix: 'opts/', suffix:'/translations/ang.json'}, {prefix: 'opts/', suffix:'/docs/metadata.json'}]),
        deps: [HttpClient]
      }
    }),
    ContactUsModule
  ]
})
export class DocumentationModule { }
