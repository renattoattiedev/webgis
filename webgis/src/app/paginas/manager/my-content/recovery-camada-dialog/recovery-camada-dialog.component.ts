import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-recovery-camada-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './recovery-camada-dialog.component.html',
  styleUrl: './recovery-camada-dialog.component.scss',
})
export class RecoveryCamadaDialogComponent {
  constructor(public dialogRef: MatDialogRef<RecoveryCamadaDialogComponent>) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
