import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthenticateService } from '../../../services/api/authenticate.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
  ],
})
export class LoginComponent implements OnInit {
  errorMessage = '';

  constructor(
    private authService: AuthenticateService,
    private router: Router,
    private recaptchaV3Service: ReCaptchaV3Service,
  ) {}

  ngOnInit(): void {
    if (this.authService.errorMessage) {
      this.errorMessage = this.authService.errorMessage;
      this.authService.errorMessage = '';
    }
  }

  public login(loginForm: NgForm) {
    const { DSC_EMAIL, DSC_PASSWORD } = loginForm.value;
    this.errorMessage = '';

    this.recaptchaV3Service
      .execute('login')
      .subscribe((captchaToken: string) => {
        this.authService
          .login(DSC_EMAIL, DSC_PASSWORD, captchaToken)
          .subscribe((response) => {
            if (response === true) {
              this.authService.setLogged(true);
              const urlIntended = this.authService.getUrlIntended();
              this.router.navigateByUrl(urlIntended);
              return;
            }

            this.errorMessage =
              this.authService.errorMessage ||
              'Login inválido. Verifique e-mail e senha.';
          });
      });
  }

  public loginWithMicrosoft() {
    window.location.href = this.authService.getMicrosoftLoginUrl();
  }
}
