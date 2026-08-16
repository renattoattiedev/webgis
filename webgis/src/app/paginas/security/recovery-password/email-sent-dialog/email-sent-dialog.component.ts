import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
@Component({
  selector: 'app-email-sent-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './email-sent-dialog.component.html',
  styleUrl: './email-sent-dialog.component.scss',
})
export class EmailSentDialogComponent {}
