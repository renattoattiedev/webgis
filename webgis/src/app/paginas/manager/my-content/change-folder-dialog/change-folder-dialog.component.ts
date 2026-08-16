import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, of } from 'rxjs';
import { Folder } from 'src/app/models/folders.camadas.model';
import { FetchFoldersService } from 'src/app/services/api/fetch.folders.service';

@Component({
  selector: 'app-change-folder-dialog',
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
  templateUrl: './change-folder-dialog.component.html',
  styleUrl: './change-folder-dialog.component.scss',
})
export class ChangeFolderDialogComponent implements OnInit {
  dataSourceFolder: Folder[] = [];
  folder: Folder | null = null;

  constructor(
    private fetchFoldersService: FetchFoldersService,
    public dialogRef: MatDialogRef<ChangeFolderDialogComponent>,
  ) {}

  ngOnInit() {
    this.fetchFolders();
  }

  fetchFolders() {
    this.fetchFoldersService
      .getFolders()
      .pipe(
        catchError((error) => {
          console.error('Erro ao buscar pastas:', error);
          return of({ folders: [] });
        }),
      )
      .subscribe((response) => {
        this.dataSourceFolder = response.folders;
      });
  }
  onClose(): void {
    this.dialogRef.close();
  }
}
