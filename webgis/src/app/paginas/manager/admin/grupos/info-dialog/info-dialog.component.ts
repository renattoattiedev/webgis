import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { v4 as uuidv4 } from 'uuid';
@Component({
  selector: 'app-info-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
  host: { '[attr.data-id]': 'uniqueId' },
})
export class InfoDialogComponent {
  uniqueId = uuidv4();
  constructor(
    public dialogRef: MatDialogRef<InfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
