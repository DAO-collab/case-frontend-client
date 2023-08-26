import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { IForm, CreateFormType } from '../../../services/forms.service';
import { UtilsService } from '../../../services/utils.service';
import { Router } from '@angular/router';

export enum FormModalMode {
  Create = 'Create',
  Edit = 'Edit'
}

@Component({
  selector: 'app-form-modal',
  templateUrl: './form-modal.component.html',
  styleUrls: ['./form-modal.component.css']
})
export class FormModalComponent implements OnInit {
  @Input() form?: IForm;
  @Input() mode?: FormModalMode;
  @Input() docType?: CreateFormType;
  @Input() roles: any;
  @Output() submitForm = new EventEmitter();
  @Output() closeModal = new EventEmitter();

  public formTouched = false;
  public validationErrors: any = [];
  public recurring = false;
  public rruleStartDate?: string;
  public FormModalMode = FormModalMode;
  public formTemplateForm = this.formBuilder.group({
    tag_id: ['', [Validators.required]],
    permissions: [[], Validators.required],
    description: '',
    rrule: '',
    notifications: null,
    type: '',
    asset_id: '',
    hours: 'hours',
    due_mins: 1
  });

  public dateItems: { text: string; id: string }[] = [{ text: 'HOURS', id: 'hours' }];

  constructor(private formBuilder: UntypedFormBuilder, private utilsService: UtilsService, public router: Router) {}

  ngOnInit() {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        this.cancelModal();
      }
    });

    this.rruleStartDate = this.utilsService.getDateForRrule();
    this.formTemplateForm.patchValue({ type: this.docType });

    if (this.mode === FormModalMode.Edit) {
      this.convertFormWithHoursToMins();
      this.formTemplateForm.patchValue(this.form!);
      this.recurring = !!this.form?.rrule;
    }
  }

  public setPermissions(permissions: string[]) {
    this.formTemplateForm.patchValue({ permissions });
  }

  public setRrule(rrule: string) {
    this.formTemplateForm.patchValue({ rrule });
  }

  public setNotifications(notifications: any) {
    this.formTemplateForm.patchValue({ notifications });
  }

  public saveNewForm() {
    this.formTouched = true;

    if (this.validationErrors.length) {
      return;
    }

    const formValue: any = this.utilsService.cleanObject(this.formTemplateForm.value);
    formValue.due_mins = this.convertHoursToMins(formValue.due_mins);
    this.submitForm.emit(formValue);
  }

  public changeRecurring() {
    this.recurring = !this.recurring;

    if (!this.recurring) {
      this.formTemplateForm.controls['rrule'].reset();
    }
  }

  public cancelModal() {
    this.closeModal.emit();
  }

  public getItemIdForTitle() {
    return this.formTemplateForm.controls['asset_id'].value.slice(
      this.formTemplateForm.controls['asset_id'].value.lastIndexOf('-') + 1
    );
  }

  public isInvalid(): boolean {
    return this.validationErrors.length > 0 || !this.formTemplateForm.value.permissions.length;
  }

  private convertHoursToMins(hours: number): number {
    return hours * 60;
  }

  private convertFormWithHoursToMins(): void {
    this.form = {
      ...this.form,
      due_mins: this.form?.due_mins! / 60
    };
  }
}
