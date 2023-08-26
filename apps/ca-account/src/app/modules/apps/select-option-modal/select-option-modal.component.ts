import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AppsService } from '../apps.service';

@Component({
  selector: 'app-select-option-modal',
  templateUrl: './select-option-modal.component.html',
  styleUrls: ['./select-option-modal.component.css']
})
export class SelectOptionModalComponent {
  constructor(private appsService: AppsService, private router: Router) {}

  closeModal(): void {
    this.appsService.isSelectOptionModalShowed = false;
  }

  openJoinAppModal(): void {
    this.closeModal();

    this.appsService.isJoinAppModalShowed = true;
  }

  openCreateAppModal(): void {
    this.closeModal();

    this.router.navigate(['apps/create']);
  }
}
