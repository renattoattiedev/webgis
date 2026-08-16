import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { NgIf, NgFor, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-attribute-table-select-columns',
  templateUrl: './attribute-table-select-columns.component.html',
  styleUrls: ['./attribute-table-select-columns.component.scss'],
  standalone: true,
  imports: [
    MatListModule,
    NgIf,
    NgFor,
    NgStyle,
    FormsModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class AttributeTableSelectColumnsComponent implements OnInit {
  selectedColumns: string[];
  columns: string[] | undefined;
  constructor(
    public dialogRef: MatDialogRef<AttributeTableSelectColumnsComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      layerName: string;
      columns: string[];
      selectedColumns: string[];
    },
    public conteudoService: ConteudoService,
  ) {
    this.selectedColumns = [...data.selectedColumns];
  }
  ngOnInit(): void {
    this.selectedColumns =
      this.data.selectedColumns.length > 0
        ? [...this.data.selectedColumns]
        : [...this.data.columns];

    const originalClose = this.dialogRef.close.bind(this.dialogRef);
    this.dialogRef.close = (result?: any) => {
      if (result === undefined) {
        originalClose(this.selectedColumns);
      } else {
        originalClose(result);
      }
    };

    this.columns = this.data.columns.filter(
      (column) => !column.startsWith('menu') && !column.startsWith('geometry'),
    );
  }

  updateSelectedColumns(): void {
    this.data.selectedColumns = this.selectedColumns;
  }
  toggleColumn(column: string): void {
    const index = this.selectedColumns.indexOf(column);
    if (index > -1) {
      this.selectedColumns.splice(index, 1);
    } else {
      this.selectedColumns.push(column);
    }
  }

  fecharDialogo() {
    this.dialogRef.close(this.selectedColumns);
  }

  selectAllColumns(): void {
    this.selectedColumns = [...(this.columns || [])];
    this.updateSelectedColumns();
  }

  deselectAllColumns(): void {
    this.selectedColumns = [];
    this.updateSelectedColumns();
  }
}
