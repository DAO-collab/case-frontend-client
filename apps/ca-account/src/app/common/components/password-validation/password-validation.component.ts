import { Component, OnInit, Input } from '@angular/core';

/**
 * Password validation component.
 */
@Component({
  selector: 'app-password-validation',
  templateUrl: './password-validation.component.html',
  styleUrls: ['./password-validation.component.css']
})
export class PasswordValidationComponent implements OnInit {
  @Input() password!: string;
  @Input() boxType!: string;

  public isPasswordsEqual = false;

  containLowerSymbol = false;
  containCapitalSymbol = false;
  containNumber = false;
  containtMinimalLength = false;
  passwordMatch = false;

  /**
   * Sets box type.
   */
  ngOnInit() {
    this.boxType = this.boxType || 'new_password';
  }

  /**
   * Checks and manages password fields on validation.
   */
  public checkRegularExpression(passwordType: string, isMatch: boolean = false): void {
    switch (passwordType) {
      case 'newPassword':
        const checkContainLowerSymbol = /[a-z]/.test(this.password);
        this.containLowerSymbol = checkContainLowerSymbol || false;

        const checkContainCapitalSymbol = /[A-Z]/.test(this.password);
        this.containCapitalSymbol = checkContainCapitalSymbol || false;

        const checkContainNumber = /[0-9]+/.test(this.password);
        this.containNumber = checkContainNumber || false;

        const checkContaintMinimalLength = /^.{8,}$/.test(this.password);
        this.containtMinimalLength = checkContaintMinimalLength || false;

        this.passwordMatch = isMatch;
        break;
      case 'confirmPassword':
        this.passwordMatch = isMatch;
        break;
      case 'currentPassword':
        break;
    }
  }
}
