import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-del-folder-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './del-folder-dialog.component.html',
  styleUrl: './del-folder-dialog.component.scss',
})
export class DelFolderDialogComponent {
  constructor(public dialogRef: MatDialogRef<DelFolderDialogComponent>) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
