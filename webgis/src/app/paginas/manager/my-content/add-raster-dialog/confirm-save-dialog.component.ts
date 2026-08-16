import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="idedlg">
      <header class="idedlg-head">
        <div class="idedlg-head-left">
          <div class="idedlg-head-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div class="idedlg-head-text">
            <h2 class="idedlg-title">{{ data.title }}</h2>
            <p class="idedlg-sub" *ngIf="data.subtitle">{{ data.subtitle }}</p>
          </div>
        </div>
        <button
          class="idedlg-close"
          (click)="onCancel()"
          type="button"
          aria-label="Fechar"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <div mat-dialog-content>
        <div class="idedlg-body">
          <p>{{ data.message }}</p>
        </div>
      </div>

      <div mat-dialog-actions>
        <footer class="idedlg-actions">
          <button
            class="idedlg-btn idedlg-btn-ghost"
            (click)="onCancel()"
            type="button"
          >
            {{ data.cancelText || 'Cancelar' }}
          </button>
          <button
            class="idedlg-btn idedlg-btn-primary"
            (click)="onConfirm()"
            type="button"
            cdkFocusInitial
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {{ data.confirmText || 'Confirmar' }}
          </button>
        </footer>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
