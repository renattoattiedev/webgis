import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UpdateTemaService } from 'src/app/services/api/update.tema.service';

@Component({
  selector: 'app-edit-temas-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './edit-temas-dialog.component.html',
  styleUrl: './edit-temas-dialog.component.scss',
})
export class EditTemasDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<EditTemasDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private updateTemaService: UpdateTemaService,
  ) {}

  ngOnInit(): void {
    console.log(this.data);
  }

  submitPacote() {
    this.updateTemaService.updateTema(this.data.tema).subscribe(() => {
      this.dialogRef.close();
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
