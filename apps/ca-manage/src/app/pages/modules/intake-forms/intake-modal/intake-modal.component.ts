import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { UtilsService } from '../../../../services/utils.service';

export enum FormModalMode {
  Create = 'Create',
  Edit = 'Edit'
}

@Component({
  selector: 'app-intake-modal',
  templateUrl: './intake-modal.component.html',
  styleUrls: ['./intake-modal.component.css']
})
export class IntakeModalComponent implements OnInit {
  @Input() intake?: any;
  @Input() mode?: FormModalMode;
  @Input() docType?: any;
  @Input() roles: any;
  @Output() submitForm = new EventEmitter();
  @Output() closeModal = new EventEmitter();

  public formTouched = false;
  public validationErrors: any = [];
  public recurring = false;
  public FormModalMode = FormModalMode;
  public formTemplateForm = this.formBuilder.group({
    tag_id: ['', [Validators.required]],
    description: '',
    type: '',
    asset_id: ''
  });

  constructor(private formBuilder: UntypedFormBuilder, private utilsService: UtilsService, public router: Router) {}

  ngOnInit() {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        this.cancelModal();
      }
    });
    this.formTemplateForm.patchValue({ type: this.docType });

    if (this.mode === FormModalMode.Edit) {
      this.formTemplateForm.patchValue(this.intake);
    }
  }

  public saveNewForm() {
    this.formTouched = true;

    if (this.validationErrors.length) {
      return;
    }

    const formValue = this.utilsService.cleanObject(this.formTemplateForm.value);
    this.submitForm.emit(formValue);
  }

  public cancelModal() {
    this.closeModal.emit();
  }

  public getItemIdForTitle() {
    return this.formTemplateForm.controls['asset_id'].value.slice(
      this.formTemplateForm.controls['asset_id'].value.lastIndexOf('-') + 1
    );
  }
}
