import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GrupoAvatarBadgeComponent } from './grupo-avatar-badge.component';

describe('GrupoAvatarBadgeComponent', () => {
  let fixture: ComponentFixture<GrupoAvatarBadgeComponent>;
  let component: GrupoAvatarBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrupoAvatarBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GrupoAvatarBadgeComponent);
    component = fixture.componentInstance;
  });

  it('mostra ate "max" circulos e agrupa o resto em +N', () => {
    component.grupos = [
      { id: '1', nome: 'Rede de Água', sigla: 'RA' },
      { id: '2', nome: 'Setores', sigla: 'SE' },
      { id: '3', nome: 'DMC', sigla: 'DM' },
      { id: '4', nome: 'Zona Norte', sigla: 'ZN' },
      { id: '5', nome: 'Zona Sul', sigla: 'ZS' },
    ];
    component.max = 3;
    fixture.detectChanges();

    const circles = fixture.nativeElement.querySelectorAll('.gab-circle');
    expect(circles.length).toBe(3);
    expect(circles[0].textContent.trim()).toBe('RA');
    expect(circles[1].textContent.trim()).toBe('SE');
    expect(circles[2].textContent.trim()).toBe('DM');

    const overflow = fixture.nativeElement.querySelector('.gab-overflow');
    expect(overflow.textContent.trim()).toBe('+2');
  });

  it('nao mostra overflow quando os grupos cabem no limite', () => {
    component.grupos = [{ id: '1', nome: 'Rede de Água', sigla: 'RA' }];
    component.max = 3;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.gab-overflow')).toBeNull();
  });

  it('emite grupoClick com o id do grupo clicado', () => {
    component.grupos = [{ id: '1', nome: 'Rede de Água', sigla: 'RA' }];
    fixture.detectChanges();

    let idEmitido: string | undefined;
    component.grupoClick.subscribe((id: string) => (idEmitido = id));

    const circle = fixture.nativeElement.querySelector('.gab-circle');
    circle.click();

    expect(idEmitido).toBe('1');
  });

  it('gera a mesma cor sempre para o mesmo id de grupo', () => {
    const cor1 = component.corDoGrupo('abc-123');
    const cor2 = component.corDoGrupo('abc-123');
    expect(cor1).toBe(cor2);
  });
});
