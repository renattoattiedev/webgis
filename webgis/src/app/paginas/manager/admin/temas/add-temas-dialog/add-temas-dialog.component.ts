import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Tema } from 'src/app/models/temas.model';
import { CreateTemaService } from 'src/app/services/api/create.tema.service';

@Component({
  selector: 'app-add-temas-dialog',
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
  templateUrl: './add-temas-dialog.component.html',
  styleUrl: './add-temas-dialog.component.scss',
})
export class AddTemasDialogComponent {
  tema: Tema = {
    tituloTema: '',
    criadoEm: '',
    nomeUsrCriacao: '',
    updatedAt: '',
    nomeUsrAlteracao: '',
    id: '',
    grupos: [],
  };

  constructor(
    public dialogRef: MatDialogRef<AddTemasDialogComponent>,
    private createTemaService: CreateTemaService,
  ) {}

  ngOnInit(): void {}
  submitTema(form: NgForm) {
    if (form.valid) {
      this.createTemaService.createTema(this.tema).subscribe(() => {
        this.dialogRef.close();
      });
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
