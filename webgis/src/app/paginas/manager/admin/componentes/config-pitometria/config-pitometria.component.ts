import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Camadas } from 'src/app/models/camadas.model';
import { Atributos } from 'src/app/models/atributos.model';
import { Componente } from 'src/app/models/componente.model';
import { FetchContentOrganizationService } from 'src/app/services/api/fetch.content.organization.service';
import { FetchAtributosService } from 'src/app/services/api/fetch.atributos.camadas.service';
import { UpdateComponenteService } from 'src/app/services/api/update-componente.service';

interface CamadaEspacial {
  camadaId: string;
  label: string;
  nomeCamada: string;
  workspace: string;
  temaId: string;
  grupoId: string;
  campo: string;
  campoLabel: string;
}

@Component({
  selector: 'app-config-pitometria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggle,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './config-pitometria.component.html',
  styleUrl: './config-pitometria.component.scss',
})
export class ConfigPitometriaComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() componente: Componente | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  habilitado = true;
  camadasDisponiveis: Camadas[] = [];

  camadaAlvoId: string | null = null;
  camadaAlvoNome = '';
  private readonly workspacePadrao = 'content';
  camadaAlvoTemaId = '';
  camadaAlvoGrupoId = '';
  erroCompatibilidade = '';
  erroSemCamada = '';

  camadaEspacialSelecionadaId: string | null = null;
  camadasEspaciais: CamadaEspacial[] = [];
  compatibilidadePorCamada: Record<
    string,
    { compativel: boolean; faltantes: string[] }
  > = {};

  // ── Edição de campo por chip ──────────────────────────────────────────────
  camadaEdicaoId: string | null = null;
  atributosPorCamada: Record<string, Atributos[]> = {};
  campoEditando = '';
  carregandoAtributos = false;

  private readonly requisitosCrud = [
    {
      chave: 'cod_pitometria_id',
      aliases: ['cod_pitometria_id', 'codpitometriaid'],
    },
    { chave: 'cod_simp', aliases: ['cod_simp', 'codsimp'] },
    { chave: 'matricula', aliases: ['matricula'] },
    { chave: 'tipo', aliases: ['tipo'] },
    { chave: 'geometry', aliases: ['geometry', 'geom', 'the_geom'] },
    {
      chave: 'cod_usuario_criacao',
      aliases: ['cod_usuario_criacao', 'codusuariocriacao'],
    },
    { chave: 'dhs_criacao', aliases: ['dhs_criacao', 'dhscriacao'] },
    {
      chave: 'cod_usuario_atualizacao',
      aliases: ['cod_usuario_atualizacao', 'codusuarioatualizacao'],
    },
    {
      chave: 'dhs_atualizacao',
      aliases: ['dhs_atualizacao', 'dhsatualizacao'],
    },
    { chave: 'dhs_exclusao', aliases: ['dhs_exclusao', 'dhsexclusao'] },
  ];

  constructor(
    private fetchContentService: FetchContentOrganizationService,
    private fetchAtributosService: FetchAtributosService,
    private updateComponenteService: UpdateComponenteService,
  ) {}

  ngOnInit(): void {
    this.fetchContentService.getContentOrganization().subscribe({
      next: (res) => {
        this.camadasDisponiveis = res.camadas;
        this.recalcularCompatibilidade();
      },
      error: (err) => console.error('Erro ao buscar camadas:', err),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['componente'] && this.componente) {
      this.habilitado = this.componente.habilitado ?? true;
      const cfg = this.componente.configuracao ?? {};
      const alvo = cfg.camada_alvo ?? null;
      if (alvo) {
        this.camadaAlvoId = alvo.camada ?? null;
        this.camadaAlvoNome = alvo.nomeCamada ?? '';
        this.camadaAlvoTemaId = alvo.tema ?? '';
        this.camadaAlvoGrupoId = alvo.grupo ?? '';
      }
      this.camadasEspaciais = cfg.camadas_espaciais ?? [];
      this.validarCamadaSelecionada();
    }
  }

  private normalizarAtributo(nome: string): string {
    return (nome ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '')
      .toLowerCase();
  }

  private calcularCompatibilidadeCamada(camada: Camadas): {
    compativel: boolean;
    faltantes: string[];
  } {
    const attrs = new Set(
      (camada.atributos ?? [])
        .flatMap((a) => [a.nomeAtributo, a.label])
        .filter(Boolean)
        .map((v) => this.normalizarAtributo(String(v))),
    );

    if (!attrs.size) {
      const nomeCamadaNorm = this.normalizarAtributo(camada.nomeCamada ?? '');
      const tituloNorm = this.normalizarAtributo(camada.tituloCamada ?? '');
      if (
        nomeCamadaNorm === 'pitometria' ||
        tituloNorm.includes('pitometria')
      ) {
        return { compativel: true, faltantes: [] };
      }
    }

    const faltantes: string[] = [];
    this.requisitosCrud.forEach((req) => {
      const ok = req.aliases.some((alias) =>
        attrs.has(this.normalizarAtributo(alias)),
      );
      if (!ok) faltantes.push(req.chave);
    });
    return { compativel: faltantes.length === 0, faltantes };
  }

  private recalcularCompatibilidade(): void {
    const map: Record<string, { compativel: boolean; faltantes: string[] }> =
      {};
    this.camadasDisponiveis.forEach((c) => {
      map[c.id] = this.calcularCompatibilidadeCamada(c);
    });
    this.compatibilidadePorCamada = map;
    this.validarCamadaSelecionada();
  }

  isCamadaCompativel(camadaId: string | null): boolean {
    if (!camadaId) return true;
    return this.compatibilidadePorCamada[camadaId]?.compativel ?? false;
  }

  getMensagemIncompatibilidade(camadaId: string | null): string {
    if (!camadaId) return '';
    const info = this.compatibilidadePorCamada[camadaId];
    if (!info || info.compativel) return '';
    return `Incompatível com CRUD de pitometria. Faltando: ${info.faltantes.join(', ')}`;
  }

  private validarCamadaSelecionada(): void {
    this.erroCompatibilidade = this.getMensagemIncompatibilidade(
      this.camadaAlvoId,
    );
    this.erroSemCamada =
      this.habilitado && !this.camadaAlvoId
        ? 'Para habilitar o componente, selecione uma camada compatível.'
        : '';
  }

  temErroBloqueante(): boolean {
    return !!this.erroCompatibilidade || !!this.erroSemCamada;
  }

  onHabilitadoChange(valor: boolean): void {
    this.habilitado = valor;
    this.validarCamadaSelecionada();
  }

  onCamadaChange(camadaId: string | null): void {
    this.camadaAlvoId = camadaId;
    const camada = this.camadasDisponiveis.find((c) => c.id === camadaId);
    this.camadaAlvoNome = camada?.nomeCamada ?? '';
    this.camadaAlvoTemaId = camada?.temaId ?? '';
    this.camadaAlvoGrupoId = camada?.grupoCamada ?? '';
    this.validarCamadaSelecionada();
  }

  salvar(): void {
    if (!this.componente) return;
    this.validarCamadaSelecionada();
    if (this.temErroBloqueante()) return;

    const camadaAlvoOut = this.camadaAlvoId
      ? {
          camada: this.camadaAlvoId,
          nomeCamada: this.camadaAlvoNome,
          workspace: this.workspacePadrao,
          tema: this.camadaAlvoTemaId,
          grupo: this.camadaAlvoGrupoId,
        }
      : null;

    const componenteAtualizado: Componente = {
      ...this.componente,
      habilitado: this.habilitado,
      configuracao: {
        version: 1,
        camada_alvo: camadaAlvoOut,
        camadas_espaciais: this.camadasEspaciais,
      },
    };

    this.updateComponenteService
      .updateComponente(componenteAtualizado)
      .subscribe({
        next: () => this.onSave.emit(componenteAtualizado),
        error: (err) => console.error('Erro ao salvar configuração:', err),
      });
  }

  adicionarCamadaEspacial(): void {
    if (!this.camadaEspacialSelecionadaId) return;
    const jaExiste = this.camadasEspaciais.some(
      (c) => c.camadaId === this.camadaEspacialSelecionadaId,
    );
    if (jaExiste) return;
    const camada = this.camadasDisponiveis.find(
      (c) => c.id === this.camadaEspacialSelecionadaId,
    );
    if (!camada) return;
    this.camadasEspaciais = [
      ...this.camadasEspaciais,
      {
        camadaId: camada.id,
        label: camada.tituloCamada,
        nomeCamada: camada.nomeCamada,
        workspace: this.workspacePadrao,
        temaId: camada.temaId ?? '',
        grupoId: camada.grupoCamada ?? '',
        campo: '',
        campoLabel: '',
      },
    ];
    this.camadaEspacialSelecionadaId = null;
  }

  removerCamadaEspacial(camadaId: string): void {
    this.camadasEspaciais = this.camadasEspaciais.filter(
      (c) => c.camadaId !== camadaId,
    );
    if (this.camadaEdicaoId === camadaId) {
      this.camadaEdicaoId = null;
    }
  }

  // ── Edição de campo ───────────────────────────────────────────────────────

  abrirEdicaoCampo(camadaId: string): void {
    if (this.camadaEdicaoId === camadaId) {
      this.camadaEdicaoId = null;
      return;
    }
    this.camadaEdicaoId = camadaId;
    const item = this.camadasEspaciais.find((c) => c.camadaId === camadaId);
    this.campoEditando = item?.campo ?? '';

    if (!this.atributosPorCamada[camadaId]) {
      this.carregandoAtributos = true;
      this.fetchAtributosService.getAtributosManager(camadaId).subscribe({
        next: (attrs) => {
          this.atributosPorCamada[camadaId] = attrs;
          this.carregandoAtributos = false;
        },
        error: () => {
          this.atributosPorCamada[camadaId] = [];
          this.carregandoAtributos = false;
        },
      });
    }
  }

  salvarCampoCamada(camadaId: string): void {
    if (!this.campoEditando) return;
    const atrs = this.atributosPorCamada[camadaId] ?? [];
    const atributo = atrs.find((a) => a.nomeAtributo === this.campoEditando);
    const campoLabel = atributo
      ? atributo.label || atributo.nomeAtributo
      : this.campoEditando;

    this.camadasEspaciais = this.camadasEspaciais.map((c) =>
      c.camadaId === camadaId
        ? { ...c, campo: this.campoEditando, campoLabel }
        : c,
    );
    this.camadaEdicaoId = null;
    this.campoEditando = '';
  }

  getAtributosCamada(camadaId: string): Atributos[] {
    return this.atributosPorCamada[camadaId] ?? [];
  }

  fecharConfig(): void {
    this.onClose.emit();
  }
}
