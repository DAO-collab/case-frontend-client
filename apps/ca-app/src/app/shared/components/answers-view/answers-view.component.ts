import { Component, OnInit, Input } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-answers-view',
  templateUrl: './answers-view.component.html',
  styleUrls: ['./answers-view.component.css']
})
export class AnswersViewComponent implements OnInit {
  @Input() teamData: any;
  @Input() answers: any;
  @Input() formId: any;
  @Input() signId: any;
  @Input() formType: any;
  @Input() signType: any;

  constructor(public utilsService: UtilsService, private router: Router) {}

  ngOnInit() {}

  showView(userId: any) {
    if (this.formId) {
      switch (this.formType) {
        case 'builder':
          window.open(`/forms/form-view/${this.formId}/${userId}/2`, '_blank');
        case 'document':
          window.open(`/forms/doc-form-view/${this.formId}/${userId}/2`, '_blank');
      }
    } else if (this.signId) {
      switch (this.signType) {
        case 'builder':
          window.open(`/e-signs/e-sign-view/${this.signId}/${userId}/2`, '_blank');
        case 'document':
          window.open(`/e-signs/doc-e-sign-view/${this.signId}/${userId}/2`, '_blank');
      }
    }
  }
}
