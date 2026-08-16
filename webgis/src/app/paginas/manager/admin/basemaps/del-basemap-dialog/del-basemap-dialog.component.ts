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
import { Basemap } from 'src/app/models/basemap.model';
import { BasemapService } from 'src/app/services/basemap.service';
import { DeleteBasemapService } from 'src/app/services/api/delete.basemap.service';

@Component({
  selector: 'app-del-basemap-dialog',
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
  templateUrl: './del-basemap-dialog.component.html',
  styleUrl: './del-basemap-dialog.component.scss',
})
export class DelBasemapDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DelBasemapDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { basemap: Basemap },
    private deleteBasemapService: DeleteBasemapService,
    private basemapService: BasemapService,
  ) {}

  excluir() {
    this.deleteBasemapService.delete(this.data.basemap.id).subscribe(
      (response) => {
        this.basemapService.notifyBasemapsChanged();
        this.dialogRef.close(response || true);
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
