import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-search',
  templateUrl: './dashboard-search.component.html',
  styleUrls: ['./dashboard-search.component.css']
})
export class DashboardSearchComponent {
  @Output() searchValue: EventEmitter<string> = new EventEmitter<string>();

  visible = false;

  toggleSearchVisibility(): void {
    this.visible = !this.visible;

    if (!this.visible) {
      this.searchValue.emit('');
    }
  }

  onKeyDown(event: Event): void {
    if (!event.target) return;
    this.searchValue.emit((event.target as HTMLInputElement).value);
  }
}
