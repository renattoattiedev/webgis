import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // 🆕 Para loading
import { MatTooltipModule } from '@angular/material/tooltip'; // 🆕 Para tooltips
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Camadas } from 'src/app/models/camadas.model';
import { Grupos } from 'src/app/models/grupo.model';
import { NiveisCompartilhamento } from 'src/app/models/niveis.compartilhamento';
import { Tema } from 'src/app/models/temas.model';
import { PacotesConceituais } from 'src/app/models/pacotes-conceituais.model';
import { CamadaPublicavel } from 'src/app/models/camada-publicavel.model';

import { FetchGrupoTemaService } from 'src/app/services/api/fetch.grupo.tema.service';
import { FetchNivelCompartilhamentoService } from 'src/app/services/api/fetch.nivel.compartilhamento.service';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { FetchPacotesConceituaisService } from 'src/app/services/api/fetch.pacotes.conceituais.service';
import { FetchCamadasPublicaveisService } from 'src/app/services/api/fetch.camadas.publicaveis.service';
import { CreateCamadasService } from 'src/app/services/api/create.camadas.service';
import { CamadaPublicationManagerService } from 'src/app/services/api/camada-publication-manager.service';
import { GruposService } from 'src/app/services/api/grupos.service';
import { ConfirmDialogComponent } from './confirm-save-dialog.component';

@Component({
  selector: 'app-add-camada-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule, // 🆕
    MatTooltipModule, // 🆕
    MatSnackBarModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-camada-dialog.component.html',
  styleUrls: ['./add-camada-dialog.component.scss'],
})
export class AddCamadaDialogComponent implements OnInit {
  niveisCompartilhamento: NiveisCompartilhamento[] = [];
  temas: Tema[] = [];
  gruposCamadas: Grupos[] = [];
  pacotesConceituais: PacotesConceituais[] = [];
  password: string = '';
  camadasPublicaveis: CamadaPublicavel[] = [];
  camadaSelecionada: CamadaPublicavel | null = null;
  selectedFile: File | null = null;
  selectedFileName: string = '';
  camadaForm!: FormGroup;

  isAdmin = false;
  isLoadingPackages = false;
  isLoadingUnpublishedLayers = false;
  selectedPacoteData: PacotesConceituais | null = null;

  camada: Camadas = {
    id: '',
    nomeCamada: '',
    tituloCamada: '',
    temaId: '',
    temaCamadaNome: '',
    grupoCamada: '',
    grupoCamadaNome: '',
    linkMetadados: '',
    descricaoCamada: '',
    pacoteConceitual: '',
    pacoteConceitualNome: '',
    nivelCompartilhamentoId: '',
    nivelCompartilhamento: '',
    tags: '',
    fonteDadosCamada: '',
    termosDeUso: '',
    boundingBox: '',
    criadoEm: '',
    updatedAt: '',
    deletedAt: '',
    usrCriacao: '',
    visivel: true,
    atributos: [],
    camadaAtiva: true,
    favorito: true,
    tableAttribute: false,
    tipo: 'vetorial',
    carregamentoDefault: false,
  };

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddCamadaDialogComponent>,
    public dialog: MatDialog,
    public fetchNivelCompartilhamentoService: FetchNivelCompartilhamentoService,
    public fetchTemasService: FetchTemasService,
    public fetchGrupoCamadasService: FetchGrupoTemaService,
    public fetchPacotesConceituaisService: FetchPacotesConceituaisService,
    public fetchCamadasPublicaveisService: FetchCamadasPublicaveisService,
    public createCamadaService: CreateCamadasService,
    private camadaPublicationManager: CamadaPublicationManagerService,
    private gruposService: GruposService,
    private snackBar: MatSnackBar,
  ) {
    this.camadaForm = this.fb.group({
      pacoteConceitual: [this.camada.pacoteConceitual, [Validators.required]],
      nomeCamada: [this.camada.nomeCamada, [Validators.required]],
      nivelCompartilhamento: [
        this.camada.nivelCompartilhamentoId,
        [Validators.required],
      ],
      tema: [this.camada.temaId, [Validators.required]],
      grupo: [this.camada.grupoCamada, [Validators.required]],
      titulo_camada: [this.camada.tituloCamada, [Validators.required]],
      descricao_camada: [
        this.camada.descricaoCamada,
        [Validators.required, Validators.minLength(10)],
      ],
      metadados: [this.camada.linkMetadados],
      termos_uso: [this.camada.termosDeUso],
      tags: [this.camada.tags],
      fonte_dados: [this.camada.fonteDadosCamada],
      estilo: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.fetchPacotesConceituais();
    this.fetchTemas();
    this.fetchNiveisCompartilhamento();
    this.checkAdminStatus();
  }

  checkAdminStatus(): void {
    this.fetchPacotesConceituaisService.isUserAdmin().subscribe({
      next: (isAdmin) => {
        this.isAdmin = isAdmin;
        if (!isAdmin) {
          console.warn('⚠️ Usuário não é admin - funcionalidades limitadas');
        }
      },
      error: () => {
        this.isAdmin = false;
      },
    });
  }

  fetchPacotesConceituais(): void {
    this.isLoadingPackages = true;
    this.fetchPacotesConceituaisService.getAllPacotes().subscribe({
      next: (pacotesConceituais: PacotesConceituais[]) => {
        console.log('📦 Pacotes recebidos:', pacotesConceituais); // Debug

        this.pacotesConceituais = (pacotesConceituais || []).filter(
          (p) => p.validadoGeoserver === true && (p.canEdit || !p.accessDenied),
        );

        this.pacotesConceituais.forEach((p) => {
          console.log(
            `Pacote: ${p.nomePacoteConceitual || p.nomePacoteConceitual || 'NOME_INDEFINIDO'}`,
          );
        });

        this.isLoadingPackages = false;
      },
      error: (error) => {
        console.error('❌ Erro ao buscar pacotes conceituais:', error);
        this.isLoadingPackages = false;
      },
    });
  }

  fetchCamadasPublicaveis(idPacoteConceitual: string): void {
    if (!idPacoteConceitual) {
      console.warn('⚠️ ID do Pacote Conceitual está vazio.');
      return;
    }

    this.selectedPacoteData =
      this.pacotesConceituais.find((p) => p.id === idPacoteConceitual) || null;

    if (!this.selectedPacoteData) {
      console.error('❌ Pacote conceitual não encontrado');
      return;
    }

    if (this.selectedPacoteData.accessDenied) {
      console.warn('🚫 Acesso negado aos dados de conexão deste pacote');
      this.camadasPublicaveis = [];
      return;
    }

    this.camadasPublicaveis = [];
    this.camadaSelecionada = null;
    this.camada.nomeCamada = '';
    this.isLoadingUnpublishedLayers = true;

    this.fetchCamadasPublicaveisService
      .getCamadasPublicaveis(idPacoteConceitual)
      .subscribe({
        next: (layers) => {
          this.camadasPublicaveis = layers;
          this.isLoadingUnpublishedLayers = false;
        },
        error: (error) => {
          console.error('❌ Erro ao buscar camadas publicáveis:', error);
          this.camadasPublicaveis = [];
          this.isLoadingUnpublishedLayers = false;
          this.snackBar.open(
            '❌ Erro ao buscar as camadas disponíveis',
            'Fechar',
            { duration: 4000 },
          );
        },
      });
  }

  onCamadaSelecionada(tableName: string): void {
    this.camadaSelecionada =
      this.camadasPublicaveis.find((c) => c.tableName === tableName) ?? null;

    if (!this.camadaSelecionada?.camadaId) return;

    const c = this.camadaSelecionada;
    this.camadaForm.patchValue({
      titulo_camada: c.titulo ?? '',
      descricao_camada: c.descricao ?? '',
      metadados: c.linkMetadados ?? '',
      termos_uso: c.termosDeUso ?? '',
      nivelCompartilhamento: c.nivelCompartilhamentoId ?? '',
      tags: c.tags ?? '',
      fonte_dados: c.fonteDadosCamada ?? '',
    });

    if (c.temaId) {
      this.camadaForm.patchValue({ tema: c.temaId });
      this.fetchGruposCamadasPorTema(c.temaId, c.grupoId ?? undefined);
    } else {
      this.camadaForm.patchValue({ grupo: c.grupoId ?? '' });
    }

    this.snackBar.open(
      'ℹ️ Esta tabela já tem camada publicada. Os metadados foram carregados.',
      'Fechar',
      { duration: 5000 },
    );
  }

  onSubmit() {
    if (this.camadaForm.invalid) {
      this.camadaForm.markAllAsTouched();
      return;
    }

    if (!this.camadaForm.get('nomeCamada')?.value) {
      console.error('❌ Nome da camada não foi definido.');
      return;
    }

    if (this.selectedPacoteData?.accessDenied) {
      this.snackBar.open(
        '🚫 Você não tem permissão para publicar camadas com este pacote conceitual',
        'Fechar',
        { duration: 4000 },
      );
      return;
    }

    if (this.camadaSelecionada?.camadaId) {
      this.openConfirmDialog()
        .afterClosed()
        .subscribe((confirm) => {
          if (confirm) this.republicarCamada();
        });
      return;
    }

    this.saveCamada();
  }

  private republicarCamada(): void {
    if (this.selectedFile) {
      this.createCamadaService
        .uploadEstilo(
          this.selectedFile,
          this.camada.pacoteConceitual,
          this.camada.nomeCamada,
        )
        .subscribe(() => this.enviarRepublicacao());
      return;
    }

    this.enviarRepublicacao();
  }

  private enviarRepublicacao(): void {
    const f = this.camadaForm.value;

    this.createCamadaService
      .republicarCamada(this.camadaSelecionada!.camadaId!, {
        tituloCamada: f.titulo_camada,
        descricaoCamada: f.descricao_camada,
        linkMetadados: f.metadados,
        termosDeUso: f.termos_uso,
        nivelCompartilhamentoId: f.nivelCompartilhamento,
        grupoCamada: f.grupo,
        tags: f.tags,
        fonteDadosCamada: f.fonte_dados,
        carregamentoDefault: this.camada.carregamentoDefault,
      })
      .subscribe({
        next: () => {
          this.camadaPublicationManager.startPolling(
            this.camadaSelecionada!.camadaId!,
          );
          this.snackBar.open(
            'ℹ️ Sobrescrita iniciada — isso pode levar alguns minutos em camadas grandes',
            'Fechar',
            { duration: 5000 },
          );
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('❌ Erro ao sobrescrever a camada:', error);
          this.snackBar.open(
            `❌ ${error?.error?.message ?? 'Erro ao sobrescrever a camada'}`,
            'Fechar',
            { duration: 6000 },
          );
        },
      });
  }

  private saveCamada() {
    if (this.selectedFile) {
      console.log(
        `💾 Salvando camada ${this.camada.nomeCamada} do pacote ${this.selectedPacoteData?.nomePacoteConceitual}`,
      );

      this.createCamadaService
        .uploadEstilo(
          this.selectedFile,
          this.camada.pacoteConceitual,
          this.camada.nomeCamada,
        )
        .subscribe(
          (uploadResponse) => {
            console.log('✅ Upload de estilo bem-sucedido:', uploadResponse);

            this.createCamadaService.createCamada(this.camada).subscribe(
              () => {
                console.log('✅ Camada criada com sucesso');
                this.dialogRef.close(true);
              },
              (camadaError) => {
                console.error('❌ Erro ao criar camada:', camadaError);
                this.dialogRef.close(false);
              },
            );
          },
          (uploadError) => {
            console.error('❌ Erro ao fazer upload do estilo:', uploadError);
            this.dialogRef.close(false);
          },
        );
    } else {
      console.error('❌ Nenhum arquivo de estilo selecionado.');
      this.dialogRef.close(false);
    }
  }

  isPacoteUsable(pacote: PacotesConceituais): boolean {
    return pacote.validadoGeoserver && !pacote.accessDenied;
  }

  getPacoteTooltip(pacote: PacotesConceituais): string {
    if (!pacote.validadoGeoserver) {
      return '⚠️ Pacote não validado no GeoServer';
    }
    if (pacote.accessDenied) {
      return '🚫 Acesso negado - Apenas administradores';
    }
    if (pacote.hasSensitiveData && !pacote.canEdit) {
      return '🔒 Dados sensíveis - Acesso limitado';
    }
    return '✅ Pacote disponível para uso';
  }

  fetchNiveisCompartilhamento(): void {
    this.fetchNivelCompartilhamentoService.getNiveis().subscribe(
      (niveisCompartilhamento: NiveisCompartilhamento[]) => {
        this.niveisCompartilhamento = niveisCompartilhamento;
      },
      (error) => {
        console.error('❌ Erro ao buscar Niveis de Compartilhamento', error);
      },
    );
  }

  fetchTemas(): void {
    this.fetchTemasService.getTemas().subscribe(
      (temas: Tema[]) => {
        this.temas = temas;
      },
      (error) => {
        console.error('❌ Erro ao buscar temas', error);
      },
    );
  }

  fetchGruposCamadasPorTema(
    idTema: string,
    grupoParaSelecionar?: string,
  ): void {
    const aplicarGrupos = (grupos: Grupos[]) => {
      this.gruposCamadas = grupos;
      if (grupoParaSelecionar) {
        this.camadaForm.patchValue({ grupo: grupoParaSelecionar });
      }
    };

    this.fetchGrupoCamadasService.getGrupo(idTema).subscribe(
      (grupos: Grupos[]) => {
        if (this.isAdmin) {
          aplicarGrupos(grupos);
          return;
        }
        this.gruposService.filtrarGruposPorMembership(grupos).subscribe({
          next: (gruposFiltrados) => aplicarGrupos(gruposFiltrados),
          error: () => aplicarGrupos(grupos),
        });
      },
      (error) => {
        console.error(
          '❌ Erro ao buscar grupos de camadas para o tema',
          idTema,
          error,
        );
      },
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.name.endsWith('.sld')) {
        this.selectedFile = file;
        this.selectedFileName = file.name;
        this.camadaForm.get('estilo')?.setValue(file.name);
        this.camadaForm.get('estilo')?.updateValueAndValidity();
      } else {
        alert('Por favor, selecione um arquivo com a extensão .sld');
        this.selectedFile = null;
        this.selectedFileName = '';
        this.camadaForm.get('estilo')?.setValue('');
      }
    }
  }

  private openConfirmDialog() {
    return this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmação',
        message:
          'Já existe uma camada publicada para esta tabela. Deseja sobrescrever? Os metadados atuais serão mantidos e os atributos, relidos do banco.',
        confirmText: 'Sim, sobrescrever',
        cancelText: 'Não',
      },
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
