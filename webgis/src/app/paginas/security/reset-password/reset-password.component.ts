import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ResetPasswordService } from 'src/app/services/api/reset.password.service';
import { SucessDialogComponent } from './sucess-dialog/sucess-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { NgForm } from '@angular/forms';
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  token!: string;

  passwordValidation = {
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
    passwordsMatch: false,
  };
  specialChars = '@$!%*?&';
  constructor(
    private route: ActivatedRoute,
    private resetPasswordService: ResetPasswordService,
    private dialog: MatDialog,
    private router: Router,
    private recaptchaV3Service: ReCaptchaV3Service,
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token')!;
  }

  validatePassword(password: string, confirmPassword: string): void {
    const minLength = password.length >= 8;
    const uppercase = /[A-Z]/.test(password);
    const lowercase = /[a-z]/.test(password);
    const number = /\d/.test(password);
    const specialChar = /[@$!%*?&]/.test(password);
    const passwordsMatch = password === confirmPassword;

    this.passwordValidation = {
      minLength,
      uppercase,
      lowercase,
      number,
      specialChar,
      passwordsMatch,
    };
  }
  resetPassword(resetForm: NgForm) {
    const { DSC_PASSWORD } = resetForm.value;

    this.recaptchaV3Service
      .execute('login')
      .subscribe((captchaToken: string) => {
        if (
          this.passwordValidation.minLength &&
          this.passwordValidation.uppercase &&
          this.passwordValidation.lowercase &&
          this.passwordValidation.number &&
          this.passwordValidation.specialChar &&
          this.passwordValidation.passwordsMatch
        ) {
          this.resetPasswordService
            .resetPassword(this.token, DSC_PASSWORD, captchaToken)
            .subscribe({
              next: () => {
                this.dialog
                  .open(SucessDialogComponent)
                  .afterClosed()
                  .subscribe(() => {
                    this.router.navigateByUrl('/login');
                  });
              },
              error: (error: any) => {
                console.error('Erro ao resetar senha.', error.error.message);
              },
            });
        } else {
          console.error(
            'A validação da senha falhou. Por favor, revise os requisitos de senha.',
          );
        }
      });
  }
}
