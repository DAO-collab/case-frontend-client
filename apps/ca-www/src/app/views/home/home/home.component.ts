import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UiService } from '@www/shared/ui.service';
import { GET_ACCOUNT_CLIENT_URL } from '@www/shared/api.utils';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Home component.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  preview = false;
  sliderIndex = 0;
  firstWidthList = [];
  secondWidthList = [];

  private destroy$ = new Subject<void>();

  get signupUrl(): string {
    return `${GET_ACCOUNT_CLIENT_URL('/apps/create')}${this.preview ? '?preview=true' : ''}`;
  }

  constructor(private uiService: UiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => (this.preview = params['preview']));
    // this.changeSubtitleWords();
    // const canvas = document.createElement('canvas');
    // const context = canvas.getContext('2d');
    // context.font = `normal 16px Proxima, Arial, Helvetica, sans-serif`;
    // this.firstWidthList = [
    //   context.measureText(this.translateService.instant('you')).width + 15,
    //   context.measureText(this.translateService.instant('lawyers')).width + 15,
    //   context.measureText(this.translateService.instant('doctors')).width + 15,
    //   context.measureText(this.translateService.instant('creatives')).width + 15
    // ];
    // this.secondWidthList = [
    //   context.measureText(this.translateService.instant('your clients')).width + 19,
    //   context.measureText(this.translateService.instant('their clients')).width + 19,
    //   context.measureText(this.translateService.instant('their patients')).width + 19,
    //   context.measureText(this.translateService.instant('their clients')).width + 23
    // ];
  }

  /**
   * Scrolls to the top of the page.
   */
  public scrollPageToTop(): void {
    this.uiService.scrollPageToTop();
  }

  /**
   * Change words in subtitle
   */
  private changeSubtitleWords() {
    setInterval(() => {
      this.sliderIndex === 3 ? (this.sliderIndex = 0) : this.sliderIndex++;
    }, 3000);
  }
}
