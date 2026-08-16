import { CheckCamadaRasterFavoritaUseCase } from './../../../domain/camadas-raster/application/use-cases/check-camada-raster-favorita';
import { BadRequestException, Controller, Get } from '@nestjs/common';
import { CamadasPresenter } from '../presenters/camadas-presenter';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';
import { FetchGrupoUseCase } from '@/domain/manager/application/use-cases/fetch-grupo';
import { GetUserUseCase } from '@/domain/security/application/use-cases/get-user';
import { FetchNivelCompartilhamentoUseCase } from '@/domain/manager/application/use-cases/fetch-nivel-compartilhamento';
import { FetchTemasUseCase } from '@/domain/manager/application/use-cases/fetch-temas';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { FetchContentUserUseCase } from '@/domain/manager/application/use-cases/fetch-content-user';
import { CheckCamadaFavoritaUseCase } from '@/domain/camadas/application/use-cases/check-camada-favorita';
import { MapasPresenter } from '../presenters/mapas-presenter';
import { CheckMapaFavoritoUseCase } from '@/domain/mapas/application/use-cases/check-mapa-favorito';
import { CamadasRasterPresenter } from '../presenters/camadas-raster-presenter';
import { GetOrdemCamadaUseCase } from '@/domain/mapas/application/use-cases/get-ordem-camada';
import { GetOrdemCamadaRasterUseCase } from '@/domain/mapas/application/use-cases/get-ordem-camada-raster';
import { GrupoItensAdicionaisRepository } from '@/domain/manager/application/repositories/grupo-itens-adicionais-repository';

@Controller('/fetch-content-usuario')
export class FetchContentUserController {
  constructor(
    private fetchContentUserUseCase: FetchContentUserUseCase,
    private fetchPacotesConceituais: FetchPacotesConceituaisUseCase,
    private fetchGrupo: FetchGrupoUseCase,
    private getUsuario: GetUserUseCase,
    private fetchNivelCompartilhamento: FetchNivelCompartilhamentoUseCase,
    private fetchTemasId: FetchTemasUseCase,
    private checkCamadaFavoritaUseCase: CheckCamadaFavoritaUseCase,
    private checkCamadaRasterFavoritaUseCase: CheckCamadaRasterFavoritaUseCase,
    private checkMapaFavoritoUseCase: CheckMapaFavoritoUseCase,
    private getOrdemCamadaUseCase: GetOrdemCamadaUseCase,
    private getOrdemCamadaRasterUseCase: GetOrdemCamadaRasterUseCase,
    private grupoItensAdicionaisRepository: GrupoItensAdicionaisRepository,
  ) {}

  @Get()
  async handle(@CurrentUser() user?: UserPayload) {
    if (!user) {
      throw new BadRequestException('Usuário não autenticado!');
    }
    const result = await this.fetchContentUserUseCase.executeMany({
      COD_USUARIO_CRIACAO: user?.sub,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar o conteúdo');
    }

    const camadas = result.value.camadas;
    const camadasRaster = result.value.camadasRaster;
    const mapas = result.value.mapas;

    const enrichedCamadas = await Promise.all(
      camadas.map((camada) => this.enrichCamada(camada, user)),
    );

    const enrichedCamadasRaster = await Promise.all(
      camadasRaster.map((camadaRaster) =>
        this.enrichCamadaRaster(camadaRaster, user),
      ),
    );

    const enrichedMapas = await Promise.all(
      mapas.map((mapa) => this.enrichMapa(mapa, user)),
    );
    return {
      camadas: enrichedCamadas,
      camadasRaster: enrichedCamadasRaster,
      mapas: enrichedMapas,
    };
  }

  private async enrichCamada(camada: any, user): Promise<any> {
    const pacoteConceitualNome = await this.getPacoteConceitualNome(
      camada.camadaPacotesConceituais,
    );
    const temaId = await this.getTemaId(camada.camadaGruposCamadas);
    const usrCriacao = await this.getUser(camada.camadaUsuarioCriacao);
    const nivelCompartilhamento = await this.getNivelCompartilhamento(
      camada.camadaNivelCompartilhamento,
    );
    const grupoCamadaNome = await this.getGrupo(camada.camadaGruposCamadas);

    const temaCamadaNome = await this.getTema(temaId);

    const favorito = await this.checkCamadaFavoritaUseCase.execute({
      COD_CAMADA_ID: camada.id.value,
      COD_USER_ID: user?.sub,
    });

    const gruposAdicionaisIds =
      await this.grupoItensAdicionaisRepository.findGrupoIdsByItem(
        'camada',
        camada.id.toString(),
      );

    const grupos = await this.getGruposDoItem(
      camada.camadaGruposCamadas,
      gruposAdicionaisIds,
    );

    return {
      ...CamadasPresenter.toHTTP(camada),
      pacoteConceitualNome: pacoteConceitualNome,
      temaId: temaId,
      usrCriacao: usrCriacao,
      nivelCompartilhamento: nivelCompartilhamento,
      grupoCamadaNome: grupoCamadaNome,
      temaCamadaNome: temaCamadaNome,
      favorito: favorito.value?.favorito,
      gruposAdicionaisIds,
      grupos,
    };
  }

  private async enrichCamadaRaster(camada: any, user): Promise<any> {
    const temaId = await this.getTemaId(camada.camadaGruposCamadas);
    const usrCriacao = await this.getUser(camada.camadaUsuarioCriacao);
    const nivelCompartilhamento = await this.getNivelCompartilhamento(
      camada.camadaNivelCompartilhamento,
    );
    const grupoCamadaNome = await this.getGrupo(camada.camadaGruposCamadas);

    const temaCamadaNome = await this.getTema(temaId);

    const favorito = await this.checkCamadaRasterFavoritaUseCase.execute({
      COD_CAMADA_RASTER_ID: camada.id.value,
      COD_USER_ID: user?.sub,
    });

    const gruposAdicionaisIds =
      await this.grupoItensAdicionaisRepository.findGrupoIdsByItem(
        'raster',
        camada.id.toString(),
      );

    const grupos = await this.getGruposDoItem(
      camada.camadaGruposCamadas,
      gruposAdicionaisIds,
    );

    return {
      ...CamadasRasterPresenter.toHTTP(camada),
      temaId: temaId,
      usrCriacao: usrCriacao,
      nivelCompartilhamento: nivelCompartilhamento,
      grupoCamadaNome: grupoCamadaNome,
      temaCamadaNome: temaCamadaNome,
      favorito: favorito.value?.favorito,
      gruposAdicionaisIds,
      grupos,
    };
  }

  private async enrichMapa(mapa: any, user): Promise<any> {
    const temaId = await this.getTemaId(mapa.mapaGrupo);
    const usrCriacao = await this.getUser(mapa.mapaUsuarioCriacao);
    const nivelCompartilhamento = await this.getNivelCompartilhamento(
      mapa.mapaNivelCompartilhamento,
    );
    const grupoMapaNome = await this.getGrupo(mapa.mapaGrupo);
    const temaMapaNome = await this.getTema(temaId);

    const favorito = await this.checkMapaFavoritoUseCase.execute({
      COD_MAPA_ID: mapa.id.value,
      COD_USER_ID: user?.sub,
    });

    const enrichedCamadas = await Promise.all(
      mapa.mapaCamadas.map(async (camada) => {
        const ordemResult = await this.getOrdemCamadaUseCase.execute({
          COD_MAPA_ID: mapa.id.value,
          COD_CAMADA_ID: camada.id.value,
        });
        return {
          ...CamadasPresenter.toHTTP(camada),
          ordemRenderizacao: ordemResult.isRight()
            ? ordemResult.value.ordem
            : 0,
        };
      }),
    );

    const enrichedCamadasRaster = await Promise.all(
      mapa.mapaCamadasRaster.map(async (camadaRaster) => {
        const ordemResult = await this.getOrdemCamadaRasterUseCase.execute({
          COD_MAPA_ID: mapa.id.value,
          COD_CAMADA_RASTER_ID: camadaRaster.id.value,
        });
        return {
          ...CamadasRasterPresenter.toHTTP(camadaRaster),
          ordemRenderizacao: ordemResult.isRight()
            ? ordemResult.value.ordem
            : 0,
        };
      }),
    );

    const gruposAdicionaisIds =
      await this.grupoItensAdicionaisRepository.findGrupoIdsByItem(
        'mapa',
        mapa.id.toString(),
      );

    const grupos = await this.getGruposDoItem(
      mapa.mapaGrupo,
      gruposAdicionaisIds,
    );

    return {
      ...MapasPresenter.toHTTP(mapa),
      temaId: temaId,
      usrCriacao: usrCriacao,
      nivelCompartilhamento: nivelCompartilhamento,
      grupoMapaNome: grupoMapaNome,
      temaMapaNome: temaMapaNome,
      favorito: favorito.value?.favorito,
      camadas: enrichedCamadas,
      camadasRaster: enrichedCamadasRaster,
      gruposAdicionaisIds,
      grupos,
    };
  }

  private async getPacoteConceitualNome(
    codPacoteConceitualId: string,
  ): Promise<string> {
    const result = await this.fetchPacotesConceituais.execute({
      COD_PACOTE_CONCEITUAL_ID: codPacoteConceitualId,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar pacote conceitual');
    }

    return result.value.pacotesConceituais.pacoteConceitualNome;
  }

  private async getTemaId(codGrupoId: string): Promise<string> {
    const result = await this.fetchGrupo.execute({
      COD_GRUPO_ID: codGrupoId,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar grupo de camadas');
    }

    const primeiroGrupoCamada = result.value.grupo[0];
    return primeiroGrupoCamada.grupoTema;
  }

  private async getUser(codUser: string): Promise<string> {
    const result = await this.getUsuario.execute({ COD_USER_ID: codUser });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar o usuário');
    }

    return result.value.user.userNome;
  }

  private async getNivelCompartilhamento(
    codNivelCompartilhamento: string,
  ): Promise<string> {
    const result = await this.fetchNivelCompartilhamento.execute({
      COD_NIVEL_COMPATILHAMENTO: codNivelCompartilhamento,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar o usuário');
    }

    return result.value.nivelCompartilhamento.nivelCompartilhamentoDescricao;
  }

  private async getGrupo(codGrupoId: string): Promise<string> {
    const result = await this.fetchGrupo.execute({
      COD_GRUPO_ID: codGrupoId,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar grupo do conteúdo');
    }

    return result.value.grupo[0].grupoNome;
  }

  private async getGruposDoItem(
    grupoPrimarioId: string,
    gruposAdicionaisIds: string[],
  ): Promise<Array<{ id: string; nome: string; sigla: string }>> {
    const idsUnicos = [grupoPrimarioId, ...gruposAdicionaisIds];

    const grupos = await Promise.all(
      idsUnicos.map(async (grupoId) => {
        const result = await this.fetchGrupo.execute({
          COD_GRUPO_ID: grupoId,
        });
        if (result.isLeft() || !result.value.grupo[0]) {
          return null;
        }
        const grupo = result.value.grupo[0];
        return {
          id: grupo.id.toString(),
          nome: grupo.grupoNome,
          sigla: grupo.grupoSigla,
        };
      }),
    );

    return grupos.filter(
      (g): g is { id: string; nome: string; sigla: string } => g !== null,
    );
  }

  private async getTema(temaID: string): Promise<string> {
    const result = await this.fetchTemasId.execute({
      COD_TEMA_ID: temaID,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar grupo de camadas');
    }

    return result.value.temas[0].temaNome;
  }
}
