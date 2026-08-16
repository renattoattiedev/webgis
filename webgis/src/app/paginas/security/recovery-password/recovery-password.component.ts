import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RecoveryPasswordService } from 'src/app/services/api/recovery.password.service';
import { EmailSentDialogComponent } from './email-sent-dialog/email-sent-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { NgForm } from '@angular/forms';
@Component({
  selector: 'app-recovery-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
  ],
  templateUrl: './recovery-password.component.html',
  styleUrl: './recovery-password.component.scss',
})
export class RecoveryPasswordComponent {
  isSubmitted = false;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private recoveryPasswordService: RecoveryPasswordService,
    private dialog: MatDialog,
    private router: Router,
    private recaptchaV3Service: ReCaptchaV3Service,
  ) {}

  recoveryPassword(recoveryForm: NgForm) {
    const { DSC_EMAIL } = recoveryForm.value;

    this.recaptchaV3Service
      .execute('login')
      .subscribe((captchaToken: string) => {
        this.recoveryPasswordService
          .requestPasswordReset(DSC_EMAIL, captchaToken)
          .subscribe({
            next: () => {
              this.isSuccess = true;
              const dialogRef = this.dialog.open(EmailSentDialogComponent);

              dialogRef.afterClosed().subscribe(() => {
                this.router.navigate(['/login']);
              });
            },
            error: (error) => {
              this.errorMessage =
                error.error.message ||
                'Erro ao solicitar a recuperação de senha.';
            },
          });
      });
  }
}
