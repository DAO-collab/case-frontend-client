import { Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

/**
 * Layout service.
 */
@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private breakpointSmall = ['(max-width: 769px)'];

  constructor(private breakpointObserver: BreakpointObserver) {}

  /**
   * Getter to observe width of the page.
   */
  public get isHandset$(): Observable<boolean> {
    return this.breakpointObserver.observe(this.breakpointSmall).pipe(
      map(result => result.matches),
      shareReplay()
    );
  }
}
