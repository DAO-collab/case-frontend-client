import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';

interface TicketForm {
  message: FormControl<string>;
  title: FormControl<string>;
};

@Component({
  selector: 'app-create-ticket-modal',
  templateUrl: './create-ticket-modal.component.html',
  styleUrls: ['./create-ticket-modal.component.css']
})
export class CreateTicketModalComponent {
  @Output() submitTicket: EventEmitter<FormGroup<TicketForm>> = new EventEmitter<FormGroup<TicketForm>>();
  @Output() closeModal: EventEmitter<void> = new EventEmitter<void>();

  ticketForm: FormGroup<TicketForm> = this.fb.group({
    message: [null, Validators.required],
    title: [null, Validators.required]
  });
  formTouched = false;

  constructor(private fb: UntypedFormBuilder) {}

  close(): void {
    this.closeModal.emit();
  }

  saveNewTicket(): void {
    console.log(this.ticketForm)
    if (this.ticketForm.invalid) {
      this.formTouched = true;

      return;
    }

    this.submitTicket.emit(this.ticketForm);
  }
}
