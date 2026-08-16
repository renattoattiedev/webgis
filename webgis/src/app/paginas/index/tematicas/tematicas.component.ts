import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { FetchGrupoTemaService } from 'src/app/services/api/fetch.grupo.tema.service';
import { Tema } from 'src/app/models/temas.model';

@Component({
  selector: 'app-tematicas',
  templateUrl: './tematicas.component.html',
  styleUrls: ['./tematicas.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class TematicasComponent implements OnInit {
  temas: Tema[] = [];
  carregando = true;
  readonly skeletonCount = Array(6);

  constructor(
    private fetchTemasService: FetchTemasService,
    private fetchGrupoTemaService: FetchGrupoTemaService,
  ) {}

  ngOnInit(): void {
    this.fetchTemasService
      .getTemas()
      .pipe(
        switchMap((temas) => {
          if (!temas.length) return of([]);
          return forkJoin(
            temas.map((tema) =>
              this.fetchGrupoTemaService
                .getGrupo(tema.id)
                .pipe(catchError(() => of([]))),
            ),
          ).pipe(
            map((gruposPorTema) =>
              temas.map((tema, i) => ({ ...tema, grupos: gruposPorTema[i] })),
            ),
          );
        }),
        catchError(() => of([])),
      )
      .subscribe({
        next: (temas) => {
          this.temas = temas as Tema[];
          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
        },
      });
  }

  inicialTema(titulo: string): string {
    return titulo?.charAt(0)?.toUpperCase() ?? '?';
  }
}
