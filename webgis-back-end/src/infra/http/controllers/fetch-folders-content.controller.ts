import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FetchFolderContentUseCase } from '@/domain/folder/application/use-cases/fetch-folder-content';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { FoldersPresenter } from '../presenters/folders-presenter';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';
import { FetchGrupoUseCase } from '@/domain/manager/application/use-cases/fetch-grupo';
import { GetUserUseCase } from '@/domain/security/application/use-cases/get-user';
import { FetchNivelCompartilhamentoUseCase } from '@/domain/manager/application/use-cases/fetch-nivel-compartilhamento';
import { FetchTemasUseCase } from '@/domain/manager/application/use-cases/fetch-temas';
import { CamadasPresenter } from '../presenters/camadas-presenter';
import { CheckCamadaFavoritaUseCase } from '@/domain/camadas/application/use-cases/check-camada-favorita';
import { MapasPresenter } from '../presenters/mapas-presenter';
import { CheckMapaFavoritoUseCase } from '@/domain/mapas/application/use-cases/check-mapa-favorito';
import { CamadasRasterPresenter } from '../presenters/camadas-raster-presenter';

@Controller('/fetch-folders-content/:COD_FOLDER_ID')
export class FetchFoldersCamadasController {
  constructor(
    private fetchFoldersContentUseCase: FetchFolderContentUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private fetchPacotesConceituais: FetchPacotesConceituaisUseCase,
    private fetchGrupoCamadas: FetchGrupoUseCase,
    private getUsuario: GetUserUseCase,
    private fetchNivelCompartilhamento: FetchNivelCompartilhamentoUseCase,
    private fetchTemasId: FetchTemasUseCase,
    private checkCamadaFavoritaUseCase: CheckCamadaFavoritaUseCase,
    private checkMapaFavoritoUseCase: CheckMapaFavoritoUseCase,
  ) {}

  @Get()
  async fetchCamadasByFolderId(
    @Param('COD_FOLDER_ID') COD_FOLDER_ID: string,
    @Req() request: Request,
  ) {
    const user: UserPayload = request['user'];

    const COD_USER_ID = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID,
    });

    if (
      perfil.value?.userPerfil !== 'Admin' &&
      perfil.value?.userPerfil !== 'Publicador'
    ) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação.',
      );
    }

    try {
      const result = await this.fetchFoldersContentUseCase.execute({
        COD_FOLDER_ID,
      });

      if (result.isLeft()) {
        throw new Error('Falha ao buscar o conteúdo para a pasta');
      }

      const { folder, camadas, camadasRaster, mapas } = result.value;

      const folderCamadaEnriched = await Promise.all(
        camadas.map((camada) => this.folderCamadaEnriched(camada, user)),
      );

      const folderCamadaRasterEnriched = await Promise.all(
        camadasRaster.map((camadaRaster) =>
          this.folderCamadaRasterEnriched(camadaRaster, user),
        ),
      );

      const folderMapaEnriched = await Promise.all(
        mapas.map((mapa) => this.folderMapaEnriched(mapa, user)),
      );

      return {
        ...FoldersPresenter.toHTTP(folder),
        camadas: folderCamadaEnriched,
        camadasRaster: folderCamadaRasterEnriched,
        mapas: folderMapaEnriched,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar as camadas para a pasta.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async folderCamadaEnriched(camada: any, user): Promise<any> {
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

    return {
      ...CamadasPresenter.toHTTP(camada),
      pacoteConceitualNome: pacoteConceitualNome,
      temaId: temaId,
      usrCriacao: usrCriacao,
      nivelCompartilhamento: nivelCompartilhamento,
      grupoCamadaNome: grupoCamadaNome,
      temaCamadaNome: temaCamadaNome,
      favorito: favorito.value?.favorito,
    };
  }

  private async folderCamadaRasterEnriched(camada: any, user): Promise<any> {
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

    return {
      ...CamadasRasterPresenter.toHTTP(camada),
      temaId: temaId,
      usrCriacao: usrCriacao,
      nivelCompartilhamento: nivelCompartilhamento,
      grupoCamadaNome: grupoCamadaNome,
      temaCamadaNome: temaCamadaNome,
      favorito: favorito.value?.favorito,
    };
  }

  private async folderMapaEnriched(mapa: any, user): Promise<any> {
    const usrCriacao = await this.getUser(mapa.mapaUsuarioCriacao);
    const nivelCompartilhamento = await this.getNivelCompartilhamento(
      mapa.mapaNivelCompartilhamento,
    );
    const grupoMapaNome = await this.getGrupo(mapa.mapaGrupo);
    const temaId = await this.getTemaId(mapa.mapaGrupo);
    const temaMapaNome = await this.getTema(temaId);

    const favorito = await this.checkMapaFavoritoUseCase.execute({
      COD_MAPA_ID: mapa.id.value,
      COD_USER_ID: user?.sub,
    });

    return {
      ...MapasPresenter.toHTTP(mapa),
      usrCriacao: usrCriacao,
      nivelCompartilhamento: nivelCompartilhamento,
      grupoCamadaNome: grupoMapaNome,
      temaMapaNome: temaMapaNome,
      favorito: favorito.value?.favorito,
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
    const result = await this.fetchGrupoCamadas.execute({
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
    const result = await this.fetchGrupoCamadas.execute({
      COD_GRUPO_ID: codGrupoId,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar grupo de camadas');
    }

    return result.value.grupo[0].grupoNome;
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
