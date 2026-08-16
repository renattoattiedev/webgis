import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { GetUserPerfilService } from 'src/app/services/api/get.user.perfil.service';
import { UpdatePasswordService } from 'src/app/services/api/update.password.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { UpdateUserEmailService } from 'src/app/services/api/update.user.email.service';

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
  ],
  standalone: true,
})
export class PerfilUsuarioComponent implements OnInit {
  userForm!: FormGroup;
  passwordForm!: FormGroup;
  user: any;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  loading = false;

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
    private fb: FormBuilder,
    private userService: GetUserPerfilService,
    private updatePasswordService: UpdatePasswordService,
    private updateUserEmailService: UpdateUserEmailService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<PerfilUsuarioComponent>,
  ) {}

  ngOnInit(): void {
    this.loading = true;

    this.userForm = this.fb.group({
      nome: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: false }],
      perfil: [{ value: '', disabled: true }],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validator: this.checkPasswords },
    );

    this.passwordForm
      .get('newPassword')
      ?.valueChanges.subscribe((newPassword) => {
        const confirmPassword = this.passwordForm.get('confirmPassword')?.value;
        this.validatePassword(newPassword, confirmPassword);
      });

    this.passwordForm
      .get('confirmPassword')
      ?.valueChanges.subscribe((confirmPassword) => {
        const newPassword = this.passwordForm.get('newPassword')?.value;
        this.validatePassword(newPassword, confirmPassword);
      });

    this.userService.getCurrentUser().subscribe({
      next: (response) => {
        this.user = response.user;

        this.userForm.get('nome')?.setValue(this.user.nome);
        this.userForm.get('email')?.setValue(this.user.email);
        this.userForm.get('perfil')?.setValue(this.user.perfil);

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        this.snackBar.open('Erro ao carregar dados do usuário', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        this.loading = false;
      },
    });
  }

  validatePassword(password: string, confirmPassword: string): void {
    const minLength = password ? password.length >= 8 : false;
    const uppercase = password ? /[A-Z]/.test(password) : false;
    const lowercase = password ? /[a-z]/.test(password) : false;
    const number = password ? /\d/.test(password) : false;
    const specialChar = password ? /[@$!%*?&]/.test(password) : false;
    const passwordsMatch =
      password && confirmPassword ? password === confirmPassword : false;

    this.passwordValidation = {
      minLength,
      uppercase,
      lowercase,
      number,
      specialChar,
      passwordsMatch,
    };
  }

  formatDate(date: string): string {
    if (!date) return 'Nunca';
    const dateObj = new Date(date);
    return dateObj.toLocaleString('pt-BR');
  }

  checkPasswords(group: FormGroup) {
    const newPass = group.get('newPassword')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return newPass === confirmPass ? null : { notSame: true };
  }

  onChangeEmail(): void {
    if (this.userForm.invalid) {
      return;
    }

    this.loading = true;
    const newEmail = this.userForm.get('email')?.value;

    this.updateUserEmailService.updateEmail(newEmail).subscribe({
      next: () => {
        this.user.email = newEmail;
        this.userForm.get('email')?.setValue(newEmail);

        this.snackBar.open('Email alterado com sucesso!', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });

        this.loading = false;
      },
      error: (error: { message: any }) => {
        this.snackBar.open(error.message || 'Erro ao alterar email', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        this.loading = false;
      },
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid || !this.isPasswordValid()) {
      this.snackBar.open(
        'Por favor, atenda todos os requisitos de senha.',
        'Fechar',
        {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        },
      );
      return;
    }

    this.loading = true;

    const currentPassword = this.passwordForm.get('currentPassword')?.value;
    const newPassword = this.passwordForm.get('newPassword')?.value;

    this.updatePasswordService
      .changePassword({
        currentPassword,
        newPassword,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Senha alterada com sucesso!', 'Fechar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
          this.loading = false;
          this.passwordForm.reset();
          this.passwordValidation = {
            minLength: false,
            uppercase: false,
            lowercase: false,
            number: false,
            specialChar: false,
            passwordsMatch: false,
          };
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'Erro ao alterar senha',
            'Fechar',
            {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            },
          );
          this.loading = false;
        },
      });
  }

  isPasswordValid(): boolean {
    return (
      this.passwordValidation.minLength &&
      this.passwordValidation.uppercase &&
      this.passwordValidation.lowercase &&
      this.passwordValidation.number &&
      this.passwordValidation.specialChar &&
      this.passwordValidation.passwordsMatch
    );
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
