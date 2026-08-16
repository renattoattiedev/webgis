import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-email-verificado',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './email-verificado.component.html',
  styleUrl: './email-verificado.component.scss',
})
export class EmailVerificadoComponent {
  constructor(private router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
