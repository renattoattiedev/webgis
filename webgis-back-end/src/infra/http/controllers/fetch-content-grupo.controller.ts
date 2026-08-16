import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { FetchCamadasGrupoUseCase } from '@/domain/camadas/application/use-cases/fetch-camadas-grupo';
import { CamadasPresenter } from '../presenters/camadas-presenter';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';
import { FetchGrupoUseCase } from '@/domain/manager/application/use-cases/fetch-grupo';
import { GetUserUseCase } from '@/domain/security/application/use-cases/get-user';
import { FetchNivelCompartilhamentoUseCase } from '@/domain/manager/application/use-cases/fetch-nivel-compartilhamento';
import { FetchTemasUseCase } from '@/domain/manager/application/use-cases/fetch-temas';
import { Public } from '@/infra/auth/public';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { FetchMapasGrupoUseCase } from '@/domain/mapas/application/use-cases/fetch-mapas-grupo';
import { MapasPresenter } from '../presenters/mapas-presenter';
import { FetchCamadasRasterGrupoUseCase } from '@/domain/camadas-raster/application/use-cases/fetch-camadas-raster-grupo';
import { CamadasRasterPresenter } from '../presenters/camadas-raster-presenter';
import {
  GrupoAccessContext,
  GrupoAccessPolicy,
} from '@/domain/manager/application/services/grupo-access-policy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { GrupoItensAdicionaisRepository } from '@/domain/manager/application/repositories/grupo-itens-adicionais-repository';

@Controller('/fetch-content/:grupoId')
export class FetchContentGrupoController {
  constructor(
    private fetchCamadasGrupo: FetchCamadasGrupoUseCase,
    private fetchCamadasRasterGrupoUseCase: FetchCamadasRasterGrupoUseCase,
    private fetchMapasGrupo: FetchMapasGrupoUseCase,
    private fetchPacotesConceituais: FetchPacotesConceituaisUseCase,
    private fetchGrupo: FetchGrupoUseCase,
    private getUsuario: GetUserUseCase,
    private fetchNivelCompartilhamento: FetchNivelCompartilhamentoUseCase,
    private fetchTemasId: FetchTemasUseCase,
    private grupoAccessPolicy: GrupoAccessPolicy,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private grupoItensAdicionaisRepository: GrupoItensAdicionaisRepository,
  ) {}

  @Get()
  @Public()
  async handle(
    @Param('grupoId') COD_GRUPO_ID: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const perfil = user
      ? await this.getUserPerfilUseCase.execute({ COD_USER_ID: user.sub })
      : null;
    const ctx = await this.grupoAccessPolicy.buildContext(
      user?.sub ?? null,
      perfil?.isRight() ? perfil.value.userPerfil : null,
    );

    const resultCamadas = await this.fetchCamadasGrupo.execute({
      COD_GRUPO_ID,
    });

    if (resultCamadas.isLeft()) {
      throw new BadRequestException('Erro ao buscar camadas do grupo');
    }

    const filteredCamadas = await this.filterCamadas(
      resultCamadas.value.camadas,
      ctx,
      COD_GRUPO_ID,
    );

    const resultCamadasRaster =
      await this.fetchCamadasRasterGrupoUseCase.execute({
        COD_GRUPO_ID,
      });

    if (resultCamadasRaster.isLeft()) {
      throw new BadRequestException('Erro ao buscar camadas raster do grupo');
    }

    const filteredCamadasRaster = await this.filterCamadasRaster(
      resultCamadasRaster.value.camadasRaster,
      ctx,
      COD_GRUPO_ID,
    );

    const resultMapas = await this.fetchMapasGrupo.execute({
      COD_GRUPO_ID,
    });

    if (resultMapas.isLeft()) {
      throw new BadRequestException('Erro ao buscar mapas do grupo');
    }

    const filterMapas = await this.filterMapas(
      resultMapas.value.mapas,
      ctx,
      COD_GRUPO_ID,
    );

    return {
      camadas: filteredCamadas,
      camadasRaster: filteredCamadasRaster,
      mapas: filterMapas,
    };
  }

  private async filterCamadas(
    camadas: any[],
    ctx: GrupoAccessContext,
    grupoId: string,
  ): Promise<any[]> {
    const enrichedCamadas = await Promise.all(
      camadas.map((camada) => this.enrichCamada(camada)),
    );

    return enrichedCamadas
      .filter((camada) =>
        this.grupoAccessPolicy.canViewItemByNivel(
          ctx,
          camada.nivelCompartilhamento,
          grupoId,
          camada.idUsrCriacao,
        ),
      )
      .map((camada) => ({
        ...camada,
        podeEditar: this.grupoAccessPolicy.canEditGroupContentByGrupoId(
          ctx,
          grupoId,
          camada.idUsrCriacao,
        ),
        vinculoPrimario: camada.grupoCamada === grupoId,
      }));
  }

  private async filterCamadasRaster(
    camadasRaster: any[],
    ctx: GrupoAccessContext,
    grupoId: string,
  ): Promise<any[]> {
    const enrichedCamadasRaster = await Promise.all(
      camadasRaster.map((camadaRaster) =>
        this.enrichCamadaRaster(camadaRaster),
      ),
    );

    return enrichedCamadasRaster
      .filter((camadaRaster) =>
        this.grupoAccessPolicy.canViewItemByNivel(
          ctx,
          camadaRaster.nivelCompartilhamento,
          grupoId,
          camadaRaster.idUsrCriacao,
        ),
      )
      .map((camadaRaster) => ({
        ...camadaRaster,
        podeEditar: this.grupoAccessPolicy.canEditGroupContentByGrupoId(
          ctx,
          grupoId,
          camadaRaster.idUsrCriacao,
        ),
        vinculoPrimario: camadaRaster.grupoCamada === grupoId,
      }));
  }

  private async filterMapas(
    mapas: any[],
    ctx: GrupoAccessContext,
    grupoId: string,
  ): Promise<any[]> {
    const enrichedMapas = await Promise.all(
      mapas.map((mapa) => this.enrichMapas(mapa)),
    );

    return enrichedMapas
      .filter((mapa) =>
        this.grupoAccessPolicy.canViewItemByNivel(
          ctx,
          mapa.nivelCompartilhamento,
          grupoId,
          mapa.idUsrCriacao,
        ),
      )
      .map((mapa) => ({
        ...mapa,
        podeEditar: this.grupoAccessPolicy.canEditGroupContentByGrupoId(
          ctx,
          grupoId,
          mapa.idUsrCriacao,
        ),
        vinculoPrimario: mapa.grupoMapa === grupoId,
      }));
  }
  private async enrichCamada(camada: any): Promise<any> {
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

    const gruposAdicionaisIds =
      await this.grupoItensAdicionaisRepository.findGrupoIdsByItem(
        'camada',
        camada.id.toString(),
      );

    return {
      ...CamadasPresenter.toHTTP(camada),
      pacoteConceitualNome: pacoteConceitualNome,
      temaId: temaId,
      usrCriacao: usrCriacao,
      nivelCompartilhamento: nivelCompartilhamento,
      grupoCamadaNome: grupoCamadaNome,
      temaCamadaNome: temaCamadaNome,
      gruposAdicionaisIds,
    };
  }

  private async enrichCamadaRaster(camadaRaster: any): Promise<any> {
    const temaId = await this.getTemaId(camadaRaster.camadaGruposCamadas);
    const usrCriacao = await this.getUser(camadaRaster.camadaUsuarioCriacao);
    const nivelCompartilhamento = await this.getNivelCompartilhamento(
      camadaRaster.camadaNivelCompartilhamento,
    );
    const grupoCamadaRasterNome = await this.getGrupo(
      camadaRaster.camadaGruposCamadas,
    );

    const temaCamadaRasterNome = await this.getTema(temaId);

    const gruposAdicionaisIds =
      await this.grupoItensAdicionaisRepository.findGrupoIdsByItem(
        'raster',
        camadaRaster.id.toString(),
      );

    return {
      ...CamadasRasterPresenter.toHTTP(camadaRaster),
      temaId: temaId,
      usrCriacao: usrCriacao,
      nivelCompartilhamento: nivelCompartilhamento,
      grupoCamadaRasterNome: grupoCamadaRasterNome,
      temaCamadaRasterNome: temaCamadaRasterNome,
      gruposAdicionaisIds,
    };
  }

  private async enrichMapas(mapa: any): Promise<any> {
    const temaId = await this.getTemaId(mapa.mapaGrupo);
    const usrCriacao = await this.getUser(mapa.mapaUsuarioCriacao);
    const nivelCompartilhamento = await this.getNivelCompartilhamento(
      mapa.mapaNivelCompartilhamento,
    );
    const grupoMapaNome = await this.getGrupo(mapa.mapaGrupo);
    const temaMapaNome = await this.getTema(temaId);

    const enrichedCamadas = mapa.mapaCamadas
      ? await Promise.all(
          mapa.mapaCamadas.map(async (camada) =>
            CamadasPresenter.toHTTP(camada),
          ),
        )
      : [];

    const enrichedCamadasRaster = mapa.mapaCamadasRaster
      ? await Promise.all(
          mapa.mapaCamadasRaster.map(async (camadaRaster) =>
            CamadasRasterPresenter.toHTTP(camadaRaster),
          ),
        )
      : [];

    const gruposAdicionaisIds =
      await this.grupoItensAdicionaisRepository.findGrupoIdsByItem(
        'mapa',
        mapa.id.toString(),
      );

    return {
      ...MapasPresenter.toHTTP(mapa),
      temaId,
      usrCriacao,
      idUsrCriacao: mapa.mapaUsuarioCriacao,
      nivelCompartilhamento,
      grupoMapaNome,
      temaMapaNome,
      camadas: enrichedCamadas,
      camadasRaster: enrichedCamadasRaster,
      gruposAdicionaisIds,
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

  private async getTema(temaID: string): Promise<string> {
    const result = await this.fetchTemasId.execute({
      COD_TEMA_ID: temaID,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar tema do conteúdo');
    }

    return result.value.temas[0].temaNome;
  }
}
