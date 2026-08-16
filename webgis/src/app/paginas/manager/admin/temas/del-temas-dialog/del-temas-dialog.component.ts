import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DeleteTemaService } from 'src/app/services/api/delete.tema.service';

@Component({
  selector: 'app-del-temas-dialog',
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
  templateUrl: './del-temas-dialog.component.html',
  styleUrl: './del-temas-dialog.component.scss',
})
export class DelTemasDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DelTemasDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private deleteTemaService: DeleteTemaService,
  ) {}

  ngOnInit(): void {
    console.log(this.data);
  }

  excluir() {
    this.deleteTemaService.delete(this.data).subscribe(
      (response) => {
        this.dialogRef.close(response);
      },
      (error) => {
        this.dialogRef.close(error);
      },
    );
  }
  onClose(): void {
    this.dialogRef.close();
  }
}
