import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ViewChildren,
  ElementRef,
  QueryList,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTable, MatTableModule } from '@angular/material/table';
import { Atributos } from 'src/app/models/atributos.model';
import { FetchAtributosService } from 'src/app/services/api/fetch.atributos.camadas.service';
import { UpdateAtributosCamadaService } from 'src/app/services/api/update.atributos.camada.service';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  CdkDragDrop,
  CdkDragMove,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-edit-atributos-camada-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatIconModule,
    DragDropModule,
  ],
  templateUrl: './edit-atributos-camada-dialog.component.html',
  styleUrl: './edit-atributos-camada-dialog.component.scss',
})
export class EditAtributosCamadaDialogComponent implements OnInit {
  @ViewChild(MatTable) table?: MatTable<Atributos>;
  @ViewChild('scrollContainer') scrollContainer?: any;
  @ViewChildren('rowEl') rowEls?: QueryList<ElementRef<HTMLTableRowElement>>;
  private dragTargetIndex: number | null = null;
  private headerOffset = 0;
  private lastRowHeight = 36;
  atributos: Atributos[] = [];
  displayedColumns: string[] = [
    'ordenacao',
    'nomeAtributo',
    'label',
    'visivel',
    'descricao',
    'acao',
  ];

  constructor(
    public dialogRef: MatDialogRef<EditAtributosCamadaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public fetchAtributosService: FetchAtributosService,
    private updateAtributosCamadaService: UpdateAtributosCamadaService,
  ) {}

  ngOnInit(): void {
    this.fetchAtributosCamada();
  }

  fetchAtributosCamada(): void {
    this.fetchAtributosService
      .getAtributosManager(this.data.camada.id)
      .subscribe(
        (atributos: Atributos[]) => {
          this.atributos = atributos.sort(
            (a, b) => (a.ordemRenderizacao ?? 0) - (b.ordemRenderizacao ?? 0),
          );
          this.refreshTable();
        },
        (error: any) => {
          console.error('Erro ao buscar Niveis de Compartilhamento', error);
        },
      );
  }

  salvarAtributo(atributo: any): void {
    atributo.isEdited = false;
    this.updateAtributosCamadaService.updateAtributo(atributo).subscribe(
      (response) => {
        console.log('Atributo salvo com sucesso!', response);
      },
      (error) => {
        console.error('Erro ao salvar atributo', error);
      },
    );
  }

  drop(event: CdkDragDrop<Atributos[]>) {
    const prevIndex = this.atributos.indexOf((event.item as any).data);
    const targetIndex =
      this.dragTargetIndex !== null ? this.dragTargetIndex : event.currentIndex;
    if (prevIndex > -1) {
      moveItemInArray(this.atributos, prevIndex, targetIndex);
    } else {
      moveItemInArray(this.atributos, event.previousIndex, targetIndex);
    }
    this.recalcularOrdem();
    this.salvarOrdem();
    this.refreshTable();
    this.dragTargetIndex = null;
  }

  moveUp(index: number): void {
    if (index <= 0) return;
    [this.atributos[index - 1], this.atributos[index]] = [
      this.atributos[index],
      this.atributos[index - 1],
    ];
    this.recalcularOrdem();
    this.salvarOrdem();
    this.refreshTable();
  }

  moveDown(index: number): void {
    if (index >= this.atributos.length - 1) return;
    [this.atributos[index + 1], this.atributos[index]] = [
      this.atributos[index],
      this.atributos[index + 1],
    ];
    this.recalcularOrdem();
    this.salvarOrdem();
    this.refreshTable();
  }

  private recalcularOrdem(): void {
    this.atributos.forEach((attr, idx) => {
      // Backend parece usar base 1 para ordem (1, 2, 3 ...)
      attr.ordemRenderizacao = idx + 1;
      (attr as any).isEdited = true;
    });
    this.refreshTable();
  }

  salvarOrdem(): void {
    // Persiste a nova ordem de renderização de todos os atributos
    const atualizacoes = this.atributos.map((attr) =>
      this.updateAtributosCamadaService.updateAtributo(attr),
    );
    // Executa em sequência para evitar sobrecarga, mas simples
    const executarSequencialmente = async () => {
      for (const obs of atualizacoes) {
        await new Promise<void>((resolve) => {
          obs.subscribe({
            next: () => resolve(),
            error: () => resolve(),
          });
        });
      }
      // Limpa marcação de edição após salvar
      this.atributos.forEach((a) => ((a as any).isEdited = false));
      console.log('Ordem de renderização salva com sucesso');
      // Recarrega do backend para refletir a ordem oficial
      this.fetchAtributosCamada();
      this.refreshTable();
    };
    executarSequencialmente();
  }

  private refreshTable(): void {
    // Força detecção de mudança do MatTable
    this.atributos = [...this.atributos];
    this.table?.renderRows();
  }

  onDragMoved(event: CdkDragMove) {
    const container: HTMLElement | undefined =
      this.scrollContainer?.nativeElement ?? this.scrollContainer;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pointerY = event.pointerPosition.y;
    const threshold = 60; // px from top/bottom to start auto-scroll
    const step = 30; // scroll amount per move event

    if (pointerY < rect.top + threshold) {
      container.scrollTop = Math.max(0, container.scrollTop - step);
    } else if (pointerY > rect.bottom - threshold) {
      container.scrollTop = container.scrollTop + step;
    }

    // Compute absolute target index considering scrollTop and row height
    // Determine target index by inspecting the element under the pointer
    const elem = document.elementFromPoint(
      event.pointerPosition.x,
      event.pointerPosition.y,
    ) as HTMLElement | null;
    let computedIndex: number | null = null;
    let node: HTMLElement | null = elem;
    while (node) {
      if (node.hasAttribute('data-index')) {
        const di = node.getAttribute('data-index');
        computedIndex = di ? parseInt(di, 10) : null;
        break;
      }
      node = node.parentElement;
    }
    if (computedIndex === null) {
      // Edge snapping if pointer is near top or bottom outside rows
      if (pointerY < rect.top + threshold) {
        computedIndex = 0;
      } else if (pointerY > rect.bottom - threshold) {
        const rowsArr = this.rowEls?.toArray() ?? [];
        computedIndex = Math.max(0, rowsArr.length - 1);
      }
    }
    if (computedIndex !== null) {
      this.dragTargetIndex = computedIndex;
    }
  }
  onClose(): void {
    this.dialogRef.close();
  }
}
