import { Component, OnInit, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { LayoutService } from './core/layout.service';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { DocumentationService } from './views/documentation/services/documentation.service';

/**
 * Root component.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public isHandset$: Observable<boolean>;

  constructor(
    private renderer: Renderer2,
    private layoutService: LayoutService,
    private documentationService: DocumentationService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platform: object
  ) {}

  /**
   * If is browser toggle no-mobile class.
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      const html = this.document.querySelector('html');

      this.renderer.addClass(html, 'js');

      this.isHandset$ = this.layoutService.isHandset$.pipe(
        tap(isHandset =>
          isHandset ? this.renderer.removeClass(html, 'no-mobile') : this.renderer.addClass(html, 'no-mobile')
        )
      );
    }

    this.documentationService
      .getDataFromJSON('categories')
      .subscribe(res => this.documentationService.categoriesJSONFileData.next(res));

    this.documentationService
      .getDataFromJSON('docs')
      .subscribe(res => this.documentationService.docsJSONFileData.next(res));
  }
}
