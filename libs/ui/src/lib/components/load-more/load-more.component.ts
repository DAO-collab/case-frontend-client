import { Component, EventEmitter, Input, NgZone, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageLoaderComponent } from '../page-loader/page-loader.component';

@Component({
  selector: 'ca-load-more',
  templateUrl: './load-more.component.html',
  styleUrls: ['./load-more.component.scss'],
  standalone: true,
  imports: [CommonModule, PageLoaderComponent]
})
export class LoadMoreComponent implements OnInit {
  @Input() isLoading: boolean = false;

  @Output() private loadMorePressed: EventEmitter<void> = new EventEmitter<void>();

  private allowLoadMore: boolean = true;

  constructor(private ngZone: NgZone) { }

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) * 1.1 >= document.body.offsetHeight) {
          this.ngZone.run(() => this.loadMore());
        }
      });
    });
  }

  loadMore(): void {
    if (this.allowLoadMore && !this.isLoading) {
      this.allowLoadMore = false;

      this.loadMorePressed.emit();

      setTimeout(() => this.allowLoadMore = true, 250);
    }
  }
}
