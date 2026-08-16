import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

@Directive()
export abstract class WindowBehavior implements OnDestroy {
  @ViewChild('draggableWindow') draggableWindow!: ElementRef<HTMLElement>;

  isMinimized = false;
  isDragging = false;
  windowPosition = { x: 100, y: 50 };
  dragOffset = { x: 0, y: 0 };

  protected defaultSize = { width: 800, height: 650 };
  protected minimizedSize = { width: 360, height: 42 };

  // NÃO permitir drag quando clicar em controles/botões
  protected dragGuardSelector = '.window-controls, button, [data-no-drag]';

  protected onMouseMoveHandler = (event: MouseEvent) => this.onMouseMove(event);
  protected onMouseUpHandler = (_: MouseEvent) => this.onMouseUp();

  protected constructor(protected cdr: ChangeDetectorRef) {}

  // Registro estático das instâncias para permitir empilhamento de janelas minimizadas
  private static instances: WindowBehavior[] = [];

  /** Registrar instância (chamado nos componentes filhos em ngAfterViewInit explicitamente ou implicitamente) */
  protected registerInstance(): void {
    if (!WindowBehavior.instances.includes(this)) {
      WindowBehavior.instances.push(this);
      WindowBehavior.repositionMinimizedStack();
    }
  }

  /** Remover instância do registro */
  protected unregisterInstance(): void {
    WindowBehavior.instances = WindowBehavior.instances.filter(
      (i) => i !== this,
    );
    WindowBehavior.repositionMinimizedStack();
  }

  /** Reposiciona todas as janelas minimizadas em uma pilha vertical no canto direito */
  private static repositionMinimizedStack(): void {
    const beaconSize = 40;
    const marginRight = 12;
    const marginTop = 80;
    const gap = 8;

    requestAnimationFrame(() => {
      const x = window.innerWidth - beaconSize - marginRight;
      let currentY = marginTop;
      for (const inst of WindowBehavior.instances) {
        if (inst.isMinimized) {
          inst.windowPosition = { x, y: currentY };
          currentY += beaconSize + gap;
        }
      }
      WindowBehavior.instances.forEach((i) => i.cdr.detectChanges());
    });
  }

  centerWindow(): void {
    const ww = window.innerWidth,
      wh = window.innerHeight;
    const { width, height } = this.defaultSize;
    this.windowPosition = {
      x: Math.max(16, (ww - width) / 2),
      y: Math.max(12, (wh - height) / 2),
    };
  }

  positionTopRight(marginRight = 24, marginTop = 80): void {
    const x = Math.max(
      16,
      window.innerWidth - this.defaultSize.width - marginRight,
    );
    this.windowPosition = { x, y: marginTop };
  }

  minimizeWindow(): void {
    this.isMinimized = true;
    // Registrar se ainda não registrado (caso não tenha sido) e reposicionar
    this.registerInstance();
    // A posição será ajustada pelo empilhamento
    WindowBehavior.repositionMinimizedStack();
    this.cdr.detectChanges();
  }

  maximizeWindow(): void {
    this.isMinimized = false;
    this.positionTopRight();
    WindowBehavior.repositionMinimizedStack();
    this.cdr.detectChanges();
  }

  /** Deve ser chamado pelos componentes concretos em ngAfterViewInit */
  public initWindowBehaviorLifecycle(): void {
    this.registerInstance();
    // Pequeno raf para garantir posicionamento inicial correto sem interferir em minimização
    requestAnimationFrame(() => WindowBehavior.repositionMinimizedStack());
  }

  getWindowStyle(): any {
    return {
      position: 'fixed',
      left: `${this.windowPosition.x}px`,
      top: `${this.windowPosition.y}px`,
    };
  }

  onHeaderMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target?.closest(this.dragGuardSelector)) return; // evita drag em botões

    this.isDragging = true;
    const el =
      this.draggableWindow?.nativeElement ??
      (event.currentTarget as HTMLElement);
    const rect = el.getBoundingClientRect();
    this.windowPosition = { x: rect.left, y: rect.top };
    this.dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    document.addEventListener('mousemove', this.onMouseMoveHandler, true);
    document.addEventListener('mouseup', this.onMouseUpHandler, true);
    event.preventDefault();
    event.stopPropagation();
  }

  protected onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.windowPosition = {
      x: event.clientX - this.dragOffset.x,
      y: event.clientY - this.dragOffset.y,
    };
    this.cdr.detectChanges();
  }

  protected onMouseUp(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onMouseMoveHandler, true);
    document.removeEventListener('mouseup', this.onMouseUpHandler, true);
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onMouseMoveHandler, true);
    document.removeEventListener('mouseup', this.onMouseUpHandler, true);
    this.unregisterInstance();
  }
}
