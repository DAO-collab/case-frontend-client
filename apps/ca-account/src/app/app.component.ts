import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

import { BehaviorSubject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import { AuthService } from './auth/auth.service';
import { FAVICON } from './utils/constants.utils';
import { environment } from '../environments/environment';
import { DesignService } from './services/design.service';

/**
 * Root component.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public showServerErrorModal = false;
  public initialLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private isProduction = environment.PRODUCTION;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private router: Router,
    private authService: AuthService,
    private renderer: Renderer2,
    private designService: DesignService
  ) {}

  /**
   * Add custom colors design to links when login with invitation to ca-app
   *
   * Append script if is not production
   *
   * Listens for authentication status.
   *
   * Sets language.
   */
  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        tap((path: NavigationEnd) => {
          const startString = 'ca-';
          const startIndex = path.url.indexOf(startString);
          const appDataFromRout = path.url.slice(startIndex, this.router.url.length);

          if (appDataFromRout.includes(startString) && !path.url.includes('/apps')) {
            this.designService.updateDesign('account-design', appDataFromRout);
          }
        })
      )
      .subscribe();

    this.insertScript();

    this.authService.authStatusListener().subscribe();
    this.initialLoading$ = this.authService.initialLoading$;

    // is this necessary?
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        const html = this.document.querySelector('html');

        // 'b' and 'e' classes doesn't seem to exist.
        this.renderer.removeClass(html, 'b');
        this.renderer.addClass(html, 'e');
      }
    });

    this.updateFavicon();
  }

  /**
   * Updates favicon.
   */
  private updateFavicon() {
    const favicon = this.document.querySelector('#favicon-icon');

    this.renderer.setAttribute(favicon, 'href', FAVICON);
  }

  private insertScript() {
    const script = this.renderer.createElement('script');

    script.type = 'text/javascript';
    script.src = this.isProduction
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';

    this.renderer.appendChild(this.document.head, script);
  }
}
