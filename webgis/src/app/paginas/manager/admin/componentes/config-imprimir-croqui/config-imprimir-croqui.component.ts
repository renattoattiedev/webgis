import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  OnChanges,
  OnDestroy,
  Inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
  MatSlideToggle,
} from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Camadas } from 'src/app/models/camadas.model';
import { Componente } from 'src/app/models/componente.model';
import { FetchContentOrganizationService } from 'src/app/services/api/fetch.content.organization.service';
import { UpdateComponenteService } from 'src/app/services/api/update-componente.service';
import { HttpClient } from '@angular/common/http';
import { Atributos } from 'src/app/models/atributos.model';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import {
  DomSanitizer,
  SafeHtml,
  SafeResourceUrl,
} from '@angular/platform-browser';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-imprimir-croqui-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatGridListModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggle,
    MatTooltipModule,
  ],
  providers: [
    {
      provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
      useValue: {
        color: '#2e7d32',
      },
    },
  ],
  templateUrl: './config-imprimir-croqui.component.html',
  styleUrl: './config-imprimir-croqui.component.scss',
})
export class ConfigImprimirCroquiComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() isVisible: boolean = false;
  @Input() componente: Componente | null = null;
  @Input() habilitado: boolean = true;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  camadasDisponiveis: Camadas[] = [];

  // Camada alvo (tem campo‑chave)
  camadaAlvoConfig: {
    camadaId: string | null;
    camadaNome: string;
    grupoId: string | null;
    temaId: string | null;
    campoChave: string | null;
    atributosDisponiveis: Atributos[];
    carregandoAtributos: boolean;
  } = {
    camadaId: null,
    camadaNome: '',
    grupoId: null,
    temaId: null,
    campoChave: null,
    atributosDisponiveis: [],
    carregandoAtributos: false,
  };

  // Camada alvo para SS (tem campo‑chave)
  camadaAlvoSsConfig: {
    camadaId: string | null;
    camadaNome: string;
    grupoId: string | null;
    temaId: string | null;
    campoChave: string | null;
    atributosDisponiveis: Atributos[];
    carregandoAtributos: boolean;
  } = {
    camadaId: null,
    camadaNome: '',
    grupoId: null,
    temaId: null,
    campoChave: null,
    atributosDisponiveis: [],
    carregandoAtributos: false,
  };

  // Camadas auxiliares (sem campo‑chave)
  auxCamadasConfigs: Array<{
    camadaId: string | null;
    camadaNome: string;
    grupoId: string | null;
    temaId: string | null;
  }> = [];

  // Layouts
  activeLayout: 'croqui' | 'formulario' = 'croqui';
  croquiHtml: string = '';
  formularioHtml: string = '';

  // Propriedades para o modal de preview
  showPreview: boolean = false;
  previewHtml: SafeHtml = '';
  previewBlobUrl: string = '';
  safePreviewUrl: SafeResourceUrl | null = null;

  // ✨ Propriedades para o modal de ajuda de variáveis
  showAjudaVariaveis: boolean = false;

  // ─── Mobile (3D) — abas Camadas · Template · Preview ────────────────────
  activeMobileTab: 'camadas' | 'template' = 'camadas';

  constructor(
    private fetchContentService: FetchContentOrganizationService,
    private updateComponenteService: UpdateComponenteService,
    private conteudoService: ConteudoService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.fetchContentService.getContentOrganization().subscribe({
      next: (res) => {
        this.camadasDisponiveis = res.camadas;
        if (this.camadaAlvoConfig.camadaNome) {
          this.loadAtributosAlvo(
            this.camadaAlvoConfig,
            this.camadaAlvoConfig.camadaNome,
          );
        } else if (this.camadaAlvoConfig.camadaId) {
          const camada = this.camadasDisponiveis.find(
            (x) => x.id === this.camadaAlvoConfig.camadaId,
          );
          if (camada?.nomeCamada)
            this.loadAtributosAlvo(this.camadaAlvoConfig, camada.nomeCamada);
        }

        if (this.camadaAlvoSsConfig.camadaNome) {
          this.loadAtributosAlvo(
            this.camadaAlvoSsConfig,
            this.camadaAlvoSsConfig.camadaNome,
          );
        } else if (this.camadaAlvoSsConfig.camadaId) {
          const camadaSs = this.camadasDisponiveis.find(
            (x) => x.id === this.camadaAlvoSsConfig.camadaId,
          );
          if (camadaSs?.nomeCamada)
            this.loadAtributosAlvo(
              this.camadaAlvoSsConfig,
              camadaSs.nomeCamada,
            );
        }
      },
      error: (err) => {
        console.error('Erro ao buscar camadas:', err);
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['componente'] && this.componente) {
      this.habilitado = this.componente.habilitado ?? true;
      const cfg = this.componente.configuracao || {};

      // Novo formato: camada_alvo (objeto) e camadas[] (auxiliares)
      const alvoObj = cfg.camada_alvo ? cfg.camada_alvo : null;
      if (alvoObj) {
        this.camadaAlvoConfig = {
          camadaId: alvoObj.camada ?? null,
          camadaNome: alvoObj.camadaNome ?? '',
          grupoId: alvoObj.grupo ?? null,
          temaId: alvoObj.tema ?? null,
          campoChave: alvoObj.campoChave ?? null,
          atributosDisponiveis: [],
          carregandoAtributos: false,
        };
      } else {
        // Fallback antigo
        this.camadaAlvoConfig = {
          camadaId: cfg.camada ?? null,
          camadaNome: cfg.camadaNome ?? '',
          grupoId: cfg.grupo ?? null,
          temaId: cfg.tema ?? null,
          campoChave: cfg.campoChave ?? null,
          atributosDisponiveis: [],
          carregandoAtributos: false,
        };
      }

      const alvoSsObj = cfg.camada_alvo_ss ? cfg.camada_alvo_ss : null;
      if (alvoSsObj) {
        this.camadaAlvoSsConfig = {
          camadaId: alvoSsObj.camada ?? null,
          camadaNome: alvoSsObj.camadaNome ?? '',
          grupoId: alvoSsObj.grupo ?? null,
          temaId: alvoSsObj.tema ?? null,
          campoChave: alvoSsObj.campoChave ?? null,
          atributosDisponiveis: [],
          carregandoAtributos: false,
        };
      } else {
        // Fallback: usa a mesma camada alvo quando não houver separação por SS
        this.camadaAlvoSsConfig = {
          camadaId: this.camadaAlvoConfig.camadaId,
          camadaNome: this.camadaAlvoConfig.camadaNome,
          grupoId: this.camadaAlvoConfig.grupoId,
          temaId: this.camadaAlvoConfig.temaId,
          campoChave: this.camadaAlvoConfig.campoChave,
          atributosDisponiveis: [],
          carregandoAtributos: false,
        };
      }

      const auxArray = Array.isArray(cfg.camadas) ? cfg.camadas : [];
      this.auxCamadasConfigs = auxArray.map((c: any) => ({
        camadaId: c.camada ?? null,
        camadaNome: c.camadaNome ?? '',
        grupoId: c.grupo ?? null,
        temaId: c.tema ?? null,
      }));

      // Templates: croqui e solicitação de serviço (ss)
      if (Array.isArray(cfg.templates)) {
        const croqui = cfg.templates.find((t: any) => t.id === 'croqui');
        const ss = cfg.templates.find((t: any) => t.id === 'ss');
        this.croquiHtml = croqui?.template ?? '';
        this.formularioHtml = ss?.template ?? '';
      } else if (Array.isArray(cfg.pages)) {
        // Compatibilidade com estrutura antiga
        const croqui = cfg.pages.find((p: any) => p.id === 'croqui');
        const formulario = cfg.pages.find((p: any) => p.id === 'formulario');
        this.croquiHtml = croqui?.template ?? '';
        this.formularioHtml = formulario?.template ?? '';
      } else {
        // Fallback muito antigo
        this.croquiHtml = cfg.html ?? '';
        this.formularioHtml = '';
      }
      // Carrega atributos da camada alvo
      if (this.camadaAlvoConfig.camadaNome) {
        this.loadAtributosAlvo(
          this.camadaAlvoConfig,
          this.camadaAlvoConfig.camadaNome,
        );
      }
      if (this.camadaAlvoSsConfig.camadaNome) {
        this.loadAtributosAlvo(
          this.camadaAlvoSsConfig,
          this.camadaAlvoSsConfig.camadaNome,
        );
      }
    }
  }

  onCamadaAlvoChange(camadaId: string | null): void {
    const cfg = this.camadaAlvoConfig;
    cfg.camadaId = camadaId;
    cfg.atributosDisponiveis = [];
    cfg.campoChave = null;

    if (!camadaId) return;

    const camada = this.camadasDisponiveis.find((c) => c.id === camadaId);
    if (!camada) return;

    cfg.camadaNome = camada.nomeCamada || '';
    cfg.grupoId = camada.grupoCamada ?? null;
    cfg.temaId = camada.temaId ?? null;

    if (cfg.camadaNome) {
      this.loadAtributosAlvo(cfg, cfg.camadaNome);
    }
  }

  onCamadaAlvoSsChange(camadaId: string | null): void {
    const cfg = this.camadaAlvoSsConfig;
    cfg.camadaId = camadaId;
    cfg.atributosDisponiveis = [];
    cfg.campoChave = null;

    if (!camadaId) return;

    const camada = this.camadasDisponiveis.find((c) => c.id === camadaId);
    if (!camada) return;

    cfg.camadaNome = camada.nomeCamada || '';
    cfg.grupoId = camada.grupoCamada ?? null;
    cfg.temaId = camada.temaId ?? null;

    if (cfg.camadaNome) {
      this.loadAtributosAlvo(cfg, cfg.camadaNome);
    }
  }

  onAuxCamadaChange(index: number, camadaId: string | null): void {
    const cfg = this.auxCamadasConfigs[index];
    if (!cfg) return;
    cfg.camadaId = camadaId;
    const camada = this.camadasDisponiveis.find((c) => c.id === camadaId);
    if (!camada) return;
    cfg.camadaNome = camada.nomeCamada || '';
    cfg.grupoId = camada.grupoCamada ?? null;
    cfg.temaId = camada.temaId ?? null;
  }

  addCamadaConfig(): void {
    this.auxCamadasConfigs.push({
      camadaId: null,
      camadaNome: '',
      grupoId: null,
      temaId: null,
    });
  }

  setMobileTab(tab: 'camadas' | 'template'): void {
    this.activeMobileTab = tab;
  }

  // O estado vazio de "camadas auxiliares" vira alvo de toque só no mobile
  // (≤768px); em telas maiores continua um bloco somente informativo.
  onEmptyAuxClick(): void {
    if (window.matchMedia('(max-width:768px)').matches) {
      this.addCamadaConfig();
    }
  }

  removeCamadaConfig(index: number): void {
    this.auxCamadasConfigs.splice(index, 1);
  }

  getCamadaById(id: string | null): Camadas | null {
    if (!id) return null;
    const c = this.camadasDisponiveis.find((x) => x.id === id);
    return c || null;
  }

  private loadAtributosAlvo(
    cfg: {
      camadaId: string | null;
      camadaNome: string;
      grupoId: string | null;
      temaId: string | null;
      campoChave: string | null;
      atributosDisponiveis: Atributos[];
      carregandoAtributos: boolean;
    },
    nomeCamada: string,
  ): void {
    cfg.carregandoAtributos = true;

    const svc: any = this.conteudoService as any;
    const tentativa$ =
      typeof svc.getAtributosCamada === 'function'
        ? svc.getAtributosCamada('vetor', nomeCamada)
        : typeof svc.getAtributosPorCamadaNome === 'function'
          ? svc.getAtributosPorCamadaNome(nomeCamada)
          : null;

    if (tentativa$) {
      tentativa$.subscribe({
        next: (attrs: Atributos[]) => {
          cfg.atributosDisponiveis = Array.isArray(attrs) ? attrs : [];
          if (
            cfg.campoChave &&
            !cfg.atributosDisponiveis.some(
              (a) => a.nomeAtributo === cfg.campoChave,
            )
          ) {
            cfg.campoChave = null;
          }
          const originalCampo =
            this.componente?.configuracao?.camada_alvo?.campoChave ??
            this.componente?.configuracao?.campoChave ??
            null;
          if (
            !cfg.campoChave &&
            originalCampo &&
            cfg.atributosDisponiveis.some(
              (a) => a.nomeAtributo === originalCampo,
            )
          ) {
            cfg.campoChave = originalCampo;
          }
          cfg.carregandoAtributos = false;
        },
        error: () => {
          this.describeFeatureTypeFallbackAlvo(cfg, nomeCamada);
        },
      });
      return;
    }

    this.describeFeatureTypeFallbackAlvo(cfg, nomeCamada);
  }

  private describeFeatureTypeFallbackAlvo(
    cfg: {
      camadaId: string | null;
      camadaNome: string;
      grupoId: string | null;
      temaId: string | null;
      campoChave: string | null;
      atributosDisponiveis: Atributos[];
      carregandoAtributos: boolean;
    },
    nomeCamada: string,
  ): void {
    const url = `/geoserver-proxy/content/wfs?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=content:${encodeURIComponent(nomeCamada)}`;
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (xmlStr: string) => {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(xmlStr, 'text/xml');
          const elements = Array.from(doc.getElementsByTagName('xsd:element'));
          const attrs: Atributos[] = elements
            .map((el: Element) => {
              const nome = el.getAttribute('name') || '';
              if (!nome) return null;
              const tipo = el.getAttribute('type') || '';
              return {
                id: '',
                nomeAtributo: nome,
                label: nome,
                tipo,
                tamanho: '',
                visivel: true,
                descricao: '',
                usuarioCriacao: '',
                usuarioUltimaAlteracao: '',
                createdAt: '',
                updatedAt: '',
              } as Atributos;
            })
            .filter(Boolean) as Atributos[];

          cfg.atributosDisponiveis = attrs;
          const originalCampo =
            this.componente?.configuracao?.camada_alvo?.campoChave ??
            this.componente?.configuracao?.campoChave ??
            null;
          if (
            !cfg.campoChave &&
            originalCampo &&
            attrs.some((a) => a.nomeAtributo === originalCampo)
          ) {
            cfg.campoChave = originalCampo;
          }
        } catch (e) {
          console.error('Falha ao interpretar DescribeFeatureType:', e);
          cfg.atributosDisponiveis = [];
        } finally {
          cfg.carregandoAtributos = false;
        }
      },
      error: (err) => {
        console.error('Erro ao buscar atributos (DescribeFeatureType):', err);
        cfg.atributosDisponiveis = [];
        cfg.carregandoAtributos = false;
      },
    });
  }

  salvarConfiguracao(): void {
    if (!this.componente) return;
    const camadaAlvoOut = this.camadaAlvoConfig.camadaId
      ? {
          tema: this.camadaAlvoConfig.temaId ?? null,
          grupo: this.camadaAlvoConfig.grupoId ?? null,
          camadaNome: this.camadaAlvoConfig.camadaNome ?? '',
          camada: this.camadaAlvoConfig.camadaId,
          campoChave: this.camadaAlvoConfig.campoChave ?? null,
        }
      : null;

    const camadaAlvoSsOut = this.camadaAlvoSsConfig.camadaId
      ? {
          tema: this.camadaAlvoSsConfig.temaId ?? null,
          grupo: this.camadaAlvoSsConfig.grupoId ?? null,
          camadaNome: this.camadaAlvoSsConfig.camadaNome ?? '',
          camada: this.camadaAlvoSsConfig.camadaId,
          campoChave: this.camadaAlvoSsConfig.campoChave ?? null,
        }
      : null;

    const camadasAuxOut = this.auxCamadasConfigs
      .filter((c) => !!c.camadaId)
      .map((c) => ({
        tema: c.temaId ?? null,
        grupo: c.grupoId ?? null,
        camadaNome: c.camadaNome ?? '',
        camada: c.camadaId,
      }));

    const templatesOut = [
      { id: 'croqui', type: 'html', template: this.croquiHtml || '' },
      { id: 'ss', type: 'html', template: this.formularioHtml || '' },
    ];

    const componenteAtualizado: Componente = {
      ...this.componente,
      habilitado: this.habilitado,
      configuracao: {
        version: 1,
        camada_alvo: camadaAlvoOut,
        camada_alvo_ss: camadaAlvoSsOut,
        camadas: camadasAuxOut,
        templates: templatesOut,
      },
    };

    this.updateComponenteService
      .updateComponente(componenteAtualizado)
      .subscribe({
        next: () => {
          this.onSave.emit(componenteAtualizado);
        },
        error: (err) => {},
      });
  }

  visualizarPreview(layout: 'croqui' | 'formulario' = this.activeLayout): void {
    const htmlToPreview =
      layout === 'croqui' ? this.croquiHtml : this.formularioHtml;
    if (!htmlToPreview.trim()) {
      alert('Por favor, adicione um template antes de visualizar o preview.');
      return;
    }

    // Limpa blob URL anterior se existir
    if (this.previewBlobUrl) {
      URL.revokeObjectURL(this.previewBlobUrl);
    }

    // Cria um blob com o HTML template (completamente isolado)
    const blob = new Blob([htmlToPreview], { type: 'text/html' });
    this.previewBlobUrl = URL.createObjectURL(blob);
    this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.previewBlobUrl,
    );

    // Adiciona classe ao body para controlar outros elementos
    this.document.body.classList.add('preview-modal-open');

    // Debug para verificar se a classe foi adicionada
    console.log(
      'Classe preview-modal-open adicionada:',
      this.document.body.classList.contains('preview-modal-open'),
    );

    // Força aplicação dos estilos
    setTimeout(() => {
      // Encontra e força z-index baixo em elementos específicos
      const elementsToHide = this.document.querySelectorAll(
        '.mat-drawer, .mat-drawer-container, .sidenav, .drawer-container',
      );
      elementsToHide.forEach((el) => {
        (el as HTMLElement).style.zIndex = '1';
        (el as HTMLElement).style.position = 'relative';
      });
    }, 10);

    this.showPreview = true;
  }

  // Alternar layout e atualizar preview se estiver aberto
  setActiveLayout(layout: 'croqui' | 'formulario'): void {
    this.activeLayout = layout;
    if (this.showPreview) {
      this.visualizarPreview(this.activeLayout);
    }
  }

  fecharPreview(): void {
    this.showPreview = false;

    // Remove classe do body
    this.document.body.classList.remove('preview-modal-open');

    // Remove estilos inline forçados
    const elementsToRestore = this.document.querySelectorAll(
      '.mat-drawer, .mat-drawer-container, .sidenav, .drawer-container',
    );
    elementsToRestore.forEach((el) => {
      (el as HTMLElement).style.zIndex = '';
      (el as HTMLElement).style.position = '';
    });

    // Limpa blob URL para liberar memória
    if (this.previewBlobUrl) {
      URL.revokeObjectURL(this.previewBlobUrl);
      this.previewBlobUrl = '';
    }

    this.previewHtml = '';
    this.safePreviewUrl = null;
  }

  // ✨ Abrir modal de ajuda com variáveis disponíveis
  abrirAjudaVariaveis(): void {
    this.showAjudaVariaveis = true;

    // Adiciona classe ao body para bloquear scroll
    this.document.body.classList.add('help-modal-open');
  }

  // ✨ Fechar modal de ajuda
  fecharAjudaVariaveis(): void {
    this.showAjudaVariaveis = false;
    this.document.body.classList.remove('help-modal-open');
  }

  fecharConfig(): void {
    this.onClose.emit();
  }

  ngOnDestroy(): void {
    // Limpa blob URL ao destruir o componente
    if (this.previewBlobUrl) {
      URL.revokeObjectURL(this.previewBlobUrl);
    }
  }
}
