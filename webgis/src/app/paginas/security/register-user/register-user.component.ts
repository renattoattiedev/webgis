import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { CreateAccountService } from 'src/app/services/api/create.account.service';
import { SucessDialogComponent } from './sucess-dialog/sucess.dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticateService } from 'src/app/services/api/authenticate.service';
import { ReCaptchaV3Service } from 'ng-recaptcha';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, RouterModule],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.scss',
})
export class RegisterUserComponent {
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
    private createAccount: CreateAccountService,
    private authService: AuthenticateService,
    private dialog: MatDialog,
    private router: Router,
    private recaptchaV3Service: ReCaptchaV3Service,
  ) {}

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
  register(NOM_USER: string, DSC_EMAIL: string, DSC_PASSWORD: string) {
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
          const userData = { NOM_USER, DSC_EMAIL, DSC_PASSWORD, captchaToken };
          this.createAccount.register(userData).subscribe({
            next: (response: any) => {
              console.log('Registro concluído', response);
              this.dialog
                .open(SucessDialogComponent)
                .afterClosed()
                .subscribe(() => {
                  const urlIntended = this.authService.getUrlIntended();
                  this.router.navigateByUrl(urlIntended);
                });
            },
            error: (error: any) => {
              console.error('Erro no registro', error);
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
