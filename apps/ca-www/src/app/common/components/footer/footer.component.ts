import { Component, EventEmitter, OnInit, Output } from '@angular/core';

/**
 * Footer component.
 */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  @Output() scrollPage = new EventEmitter<void>();

  public currentYear: number;

  /**
   * Sets current year.
   */
  ngOnInit(): void {
    this.currentYear = new Date().getFullYear();
  }

  /**
   * Scrolls to the top of the page.
   */
  public scrollPageToTop(): void {
    this.scrollPage.emit();
  }
}
