import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { catchError, of } from 'rxjs';
import { User } from 'src/app/models/users.model';
import { FetchUsuariosDonosContentService } from 'src/app/services/api/fetch.usuarios.donos.content.service';

@Component({
  selector: 'app-change-owner-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './change-owner-dialog.component.html',
  styleUrl: './change-owner-dialog.component.scss',
})
export class ChangeOwnerDialogComponent implements OnInit {
  dataSourceUsers: User[] = [];
  filteredUsers: User[] = [];
  user: User | null = null;
  constructor(
    private fetchUsersDonosCamadasService: FetchUsuariosDonosContentService,
    public dialogRef: MatDialogRef<ChangeOwnerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.fetchUsersDonosCamadas();
  }

  fetchUsersDonosCamadas() {
    this.fetchUsersDonosCamadasService
      .getUsersDonosCamadas()
      .pipe(
        catchError((error) => {
          console.error('Erro ao buscar os donos:', error);
          return of([]);
        }),
      )
      .subscribe((users: User[]) => {
        this.dataSourceUsers = users;
        this.filteredUsers = users.filter(
          (user) => user.nome !== this.data.usrCriacao,
        );
      });
  }
  onClose(): void {
    this.dialogRef.close();
  }
}
