import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Grupo } from '../../enterprise/entities/grupo';
import { GrupoMembro } from '../../enterprise/entities/grupo-membro';
import { GrupoRepository } from '../repositories/grupo-repository';
import { GrupoMembrosRepository } from '../repositories/grupo-membros-repository';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';

interface UpdateGrupoConfigUseCaseRequest {
  COD_GRUPO_ID: string;
  COD_USER_SOLICITANTE: string;
  DSC_PERFIL_SOLICITANTE: string | null;
  DSC_VISIBILIDADE?: string;
  DSC_POLITICA_PARTICIPACAO?: string;
  BOL_MEMBROS_CONTRIBUEM?: boolean;
  COD_USUARIO_DONO?: string;
  NOM_NOME_GRUPO?: string;
  COD_TEMA_ID?: string;
}

type UpdateGrupoConfigUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { grupo: Grupo }
>;

@Injectable()
export class UpdateGrupoConfigUseCase {
  constructor(
    private grupoRepository: GrupoRepository,
    private grupoMembrosRepository: GrupoMembrosRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_GRUPO_ID,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
    DSC_VISIBILIDADE,
    DSC_POLITICA_PARTICIPACAO,
    BOL_MEMBROS_CONTRIBUEM,
    COD_USUARIO_DONO,
    NOM_NOME_GRUPO,
    COD_TEMA_ID,
  }: UpdateGrupoConfigUseCaseRequest): Promise<UpdateGrupoConfigUseCaseResponse> {
    const grupo = await this.grupoRepository.findById(COD_GRUPO_ID);
    if (!grupo) return left(new ResourceNotFoundError());

    const ctx = await this.grupoAccessPolicy.buildContext(
      COD_USER_SOLICITANTE,
      DSC_PERFIL_SOLICITANTE,
    );
    if (!this.grupoAccessPolicy.canManageGrupo(ctx, grupo)) {
      return left(new NotAllowedError());
    }

    if (NOM_NOME_GRUPO !== undefined) grupo.setGrupoNome(NOM_NOME_GRUPO);
    if (COD_TEMA_ID !== undefined) grupo.setGrupoTema(COD_TEMA_ID);

    if (DSC_VISIBILIDADE !== undefined)
      grupo.setGrupoVisibilidade(DSC_VISIBILIDADE);
    if (DSC_POLITICA_PARTICIPACAO !== undefined)
      grupo.setGrupoPoliticaParticipacao(DSC_POLITICA_PARTICIPACAO);
    if (BOL_MEMBROS_CONTRIBUEM !== undefined)
      grupo.setGrupoMembrosContribuem(BOL_MEMBROS_CONTRIBUEM);

    if (
      COD_USUARIO_DONO !== undefined &&
      COD_USUARIO_DONO !== grupo.grupoDono
    ) {
      const donoAnterior = grupo.grupoDono;
      grupo.setGrupoDono(COD_USUARIO_DONO);

      const vinculoNovoDono =
        await this.grupoMembrosRepository.findByGrupoAndUser(
          COD_GRUPO_ID,
          COD_USUARIO_DONO,
        );
      if (vinculoNovoDono && vinculoNovoDono.ativo) {
        vinculoNovoDono.excluir(COD_USER_SOLICITANTE);
        await this.grupoMembrosRepository.save(vinculoNovoDono);
      }

      const vinculoAnterior =
        await this.grupoMembrosRepository.findByGrupoAndUser(
          COD_GRUPO_ID,
          donoAnterior,
        );
      if (vinculoAnterior) {
        vinculoAnterior.reativar('membro', COD_USER_SOLICITANTE);
        await this.grupoMembrosRepository.save(vinculoAnterior);
      } else {
        const novoVinculo = GrupoMembro.create(
          {
            COD_GRUPO_ID,
            COD_USER_ID: donoAnterior,
            DSC_STATUS: 'membro',
            USUARIO_CRIACAO: COD_USER_SOLICITANTE,
            DHS_INCLUSAO: new Date(),
          },
          new UniqueEntityID(),
        );
        await this.grupoMembrosRepository.create(novoVinculo);
      }
    } else if (COD_USUARIO_DONO !== undefined) {
      grupo.setGrupoDono(COD_USUARIO_DONO);
    }

    grupo.setGrupoUsuarioAlteracao(COD_USER_SOLICITANTE);

    await this.grupoRepository.save(grupo);
    return right({ grupo });
  }
}
