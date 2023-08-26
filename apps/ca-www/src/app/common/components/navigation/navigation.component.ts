import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { ILanguage } from '@www/core/language.model';
import { MobileMenuDirective } from '../../directives/mobile-menu/mobile-menu.directive';

/**
 * Navigation component.
 */
@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent {
  @ViewChild(MobileMenuDirective) mobileMenu: MobileMenuDirective;
  @Input() locale: string;
  @Input() filteredLanguages: ILanguage[];
  @Input() popularLanguages: ILanguage[];
  @Input() logoTopSrc: string;
  @Input() loginUrl: string;
  @Input() signupUrl: string;
  @Output() signedUpPopUp = new EventEmitter<void>();
  @Output() scrollPage = new EventEmitter<void>();
  @Output() languageChange = new EventEmitter<void>();

  isHomePage: boolean;

  constructor(private router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isHomePage = event.url === '/home' || event.url === '/';
      }
    });
  }

  /**
   * Controls sign up pop-up.
   */
  public manageSignUpPopUp(): void {
    this.signedUpPopUp.emit();
  }

  /**
   * Scrolls to the top of the page.
   */
  public scrollPageToTop(): void {
    this.scrollPage.emit();
  }

  /**
   * Emit language change
   */
  public onLanguageChange(): void {
    this.languageChange.emit();
  }

  /**
   * Toggle Mobile Menu
   */
  public toggleMobileMenu(): void {
    this.mobileMenu.toggleMobileMenu();
  }
}
