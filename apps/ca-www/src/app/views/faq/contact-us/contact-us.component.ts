import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, AbstractControl } from '@angular/forms';
import { ContactUsService } from '@www/views/faq/contact-us/contact-us.service';
import { throwError, Observable, Subject } from 'rxjs';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { Importance, Department } from './contact.model';
import { catchError, tap, takeUntil } from 'rxjs/operators';

import { EMAIL_REG_EXP } from '@www/shared/constants.utils';

/**
 * Contact Us component.
 */
@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css']
})
export class ContactUsComponent implements OnInit, OnDestroy {
  loading = false;
  sending = false;
  successMessage = false;
  contactUsForm: UntypedFormGroup;
  Importance = Importance;
  Department = Department;
  isError = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: UntypedFormBuilder,
    private contactUsService: ContactUsService,
    private recaptchaV3Service: ReCaptchaV3Service
  ) {}

  /**
   * Initializes contact form.
   */
  ngOnInit(): void {
    this.contactUsForm = this.fb.group({
      given_name: ['', Validators.required],
      family_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, Validators.pattern(EMAIL_REG_EXP)]],
      importance: null,
      topic: null,
      message: ['', Validators.required],
      recaptcha: ['']
    });
  }

  /**
   *  Sends form in contact us.
   */
  sendTicket(): void {
    this.getRecaptcha('ticket')
      .pipe(takeUntil(this.destroy$))
      .subscribe(token => {
        if (token) {
          this.control('recaptcha').setValue(token);
        }
        this.contactUsService
          .sendTicket(this.contactUsForm.getRawValue())
          .pipe(
            takeUntil(this.destroy$),
            tap(() => {
              this.sending = false;
              this.contactUsForm.reset();
              this.successMessage = true;
              this.isError = false;
            }),
            catchError(error => {
              this.sending = false;
              this.successMessage = false;
              this.isError = true;
              return throwError(error);
            })
          )
          .subscribe();
      });
  }

  /**
   * Executes recaptcha.
   */
  getRecaptcha(action: string): Observable<string> {
    return this.recaptchaV3Service.execute(action);
  }

  /**
   * Helper for easy accessing form controls.
   */
  private control(control: string): AbstractControl {
    return this.contactUsForm.get(control);
  }

  /**
   * Unsubscribe from observables.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
