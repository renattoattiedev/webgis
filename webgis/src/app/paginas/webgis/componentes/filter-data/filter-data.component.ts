import { Component, Inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-filter-data',
  templateUrl: './filter-data.component.html',
  styleUrls: ['./filter-data.component.scss'],
  standalone: true,
  imports: [
    MatListModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    NgFor,
    FormsModule,
  ],
})
export class FilterDataComponent {
  textoExpressao = '';
  ultimoCampoSelecionado: string | null = null;
  valoresCompletos: string[] = [];
  valoresFiltrados: string[] = [];
  isValidExpression = false;

  constructor(
    public dialogRef: MatDialogRef<FilterDataComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public conteudoService: ConteudoService,
  ) {}

  ngOnInit() {
    this.validarExpressao();
  }

  onSelectCampo(campo: any) {
    this.ultimoCampoSelecionado = campo;
    const sizeTextArea = this.textoExpressao.length;

    const textAreaElement = document.getElementById(
      'expressao-filtragem-text',
    ) as HTMLTextAreaElement;
    this.insertTextAtCursor(
      textAreaElement,
      sizeTextArea === 0 ? `"${campo}"` : ` "${campo}"`,
    );
    this.validarExpressao();
  }

  onSelectValor(valor: any) {
    const numero = parseFloat(valor);
    const valorTexto =
      !isNaN(numero) && isFinite(numero) ? ` ${numero}` : ` '${valor}'`;
    const textAreaElement = document.getElementById(
      'expressao-filtragem-text',
    ) as HTMLTextAreaElement;
    this.insertTextAtCursor(textAreaElement, valorTexto);
    this.validarExpressao();
  }

  onSelectOperador(event: any) {
    const button = this.findButtonElement(event.target);
    const operador = button ? button.textContent || button.innerText : '';
    const textAreaElement = document.getElementById(
      'expressao-filtragem-text',
    ) as HTMLTextAreaElement;
    this.insertTextAtCursor(textAreaElement, ` ${operador}`);
    this.validarExpressao();
  }

  private findButtonElement(target: EventTarget | null): HTMLElement | null {
    while (target && !(target instanceof HTMLButtonElement)) {
      target = (target as HTMLElement).parentElement;
    }
    return target as HTMLElement;
  }

  insertTextAtCursor(textAreaElement: HTMLTextAreaElement, text: string) {
    const startPos = textAreaElement.selectionStart;
    const endPos = textAreaElement.selectionEnd;

    textAreaElement.value =
      textAreaElement.value.substring(0, startPos) +
      text +
      textAreaElement.value.substring(endPos, textAreaElement.value.length);

    textAreaElement.selectionStart = startPos + text.length;
    textAreaElement.selectionEnd = startPos + text.length;

    this.textoExpressao = textAreaElement.value;
  }

  getAllData() {
    if (this.ultimoCampoSelecionado) {
      this.valoresCompletos = [];
      this.valoresCompletos = this.conteudoService.getValoresCampos(
        this.data.nomeCamada,
        this.ultimoCampoSelecionado,
        false,
      );
      this.valoresFiltrados = [...this.valoresCompletos];
    }
  }

  getSampleData() {
    if (this.ultimoCampoSelecionado) {
      this.valoresCompletos = [];
      this.valoresCompletos = this.conteudoService.getValoresCampos(
        this.data.nomeCamada,
        this.ultimoCampoSelecionado,
        true,
      );
      this.valoresFiltrados = [...this.valoresCompletos];
    }
  }

  handleSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement | null;
    if (inputElement) {
      this.filtrarValores(inputElement.value);
    }
  }

  filtrarValores(busca: string) {
    if (busca.length >= 2) {
      this.valoresFiltrados = this.valoresCompletos.filter((valor) => {
        const valorStr = valor.toString().toLowerCase();
        const buscaStr = busca.toLowerCase();

        return valorStr.includes(buscaStr);
      });
    } else {
      this.valoresFiltrados = [...this.valoresCompletos];
    }
  }

  validarExpressao() {
    const regex =
      /^(?:(?:\w+|"\w+")\s*(=|!=|<|>|<=|>=|LIKE|ILIKE|IN|NOT IN|IS NULL|IS NOT NULL)(?:\s*('[^']*'|[0-9]+|\(.*?\)))?\s*(AND|OR)?\s*)+$/;
    this.isValidExpression = regex.test(this.textoExpressao);
  }

  filtrar() {
    this.dialogRef.close(this.textoExpressao);
  }
  fecharDialogo() {
    this.dialogRef.close();
  }

  limpar() {
    this.textoExpressao = '';

    this.ultimoCampoSelecionado = null;

    this.valoresCompletos = [];
  }
}
