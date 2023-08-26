import { Component, EventEmitter, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

export enum RefundReasons {
  Duplicate = 'duplicate',
  Fraudulent = 'fraudulent',
  RequestedByCustomer = 'requested_by_customer'
}

@Component({
  selector: 'app-refund-popup',
  templateUrl: './refund-popup.component.html',
  styleUrls: ['./refund-popup.component.css']
})
export class RefundPopupComponent {
  @Output() emitReason: EventEmitter<RefundReasons> = new EventEmitter<RefundReasons>();
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  refundReasons = RefundReasons;
  refundForm: UntypedFormGroup = this.fb.group({
    reason: [null, Validators.required]
  });

  constructor(private fb: UntypedFormBuilder) {}

  selectRefundReason(): void {
    this.emitReason.emit(this.refundForm.getRawValue().reason);
  }

  onSelectRadio(reason: any): void {
    this.refundForm.patchValue({ reason });
  }

  closeModal(): void {
    this.close.emit();
  }
}
