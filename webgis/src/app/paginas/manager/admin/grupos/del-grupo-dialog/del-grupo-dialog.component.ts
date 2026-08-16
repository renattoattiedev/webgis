import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
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
import { DeleteGrupoService } from 'src/app/services/api/delete.grupo.service';

@Component({
  selector: 'app-del-grupo-dialog',
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
  templateUrl: './del-grupo-dialog.component.html',
  styleUrl: './del-grupo-dialog.component.scss',
})
export class DelGrupoDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<DelGrupoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private deleteGrupoCamadaService: DeleteGrupoService,
  ) {}

  ngOnInit(): void {
    console.log(this.data);
  }

  excluir() {
    this.deleteGrupoCamadaService.delete(this.data).subscribe(
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
