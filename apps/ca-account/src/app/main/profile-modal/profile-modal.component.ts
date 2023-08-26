import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, AbstractControl } from '@angular/forms';
import { IUser } from '@acc/core/user.model';
import { IOptions } from '@acc/core/settings.service';

/**
 * Profile modal form.
 *
 * Opens if the user has incomplete profile.
 */
@Component({
  selector: 'app-profile-modal',
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.css']
})
export class ProfileModalComponent implements OnInit {
  public profileModalForm!: UntypedFormGroup;
  @Input() options!: IOptions;
  @Input() user?: IUser;
  @Output() update = new EventEmitter<{ given_name: string; family_name: string; locale: string; zoneinfo: string }>();

  constructor(private fb: UntypedFormBuilder) {}

  /**
   * Initializes profile modal form.
   */
  ngOnInit(): void {
    this.profileModalForm = this.fb.group({
      given_name: [null, Validators.required],
      family_name: [null, Validators.required],
      locale: [null, Validators.required],
      zoneinfo: [null, Validators.required]
    });

    const { timeZone } = Intl.DateTimeFormat().resolvedOptions();

    const locale = navigator.language.split('-')[0];
    const userLocale = this.options.languages.find((lang: { id: string, text: string }) => lang.id === locale);

    this.profileModalForm.setValue({
      given_name: this.user?.given_name ? this.user?.given_name : null,
      family_name: this.user?.family_name ? this.user?.family_name : null,
      locale: this.user?.locale ? this.user?.locale : userLocale?.id,
      zoneinfo: this.user?.zoneinfo ? this.user?.zoneinfo : timeZone
    });
  }

  /**
   * Emits form value.
   */
  public onSubmit(): void {
    this.update.emit(this.profileModalForm.value);
  }

  /**
   * Helper for easy accessing form controls.
   */
  public control(control: string): AbstractControl {
    return this.profileModalForm.get(control) as AbstractControl;
  }
}
