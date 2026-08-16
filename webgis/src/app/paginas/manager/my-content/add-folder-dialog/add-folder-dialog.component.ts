import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-add-folder-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './add-folder-dialog.component.html',
  styleUrl: './add-folder-dialog.component.scss',
})
export class AddFolderDialogComponent {
  folderName: string = '';
  constructor(public dialogRef: MatDialogRef<AddFolderDialogComponent>) {}
  onClose(): void {
    this.dialogRef.close();
  }
}
