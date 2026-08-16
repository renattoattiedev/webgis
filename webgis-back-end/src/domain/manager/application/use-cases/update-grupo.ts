import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { Grupo } from '../../enterprise/entities/grupo';
import { GrupoRepository } from '../repositories/grupo-repository';
import { GrupoSiglaAlreadyExistsError } from './errors/grupo-sigla-already-exists-error';

interface UpdateGrupoCamadaRequest {
  COD_GRUPO_ID: string;
  NOM_NOME_GRUPO: string;
  COD_TEMA_ID: string;
  USUARIO_ULTIMA_ALTERACAO: string;
  SGL_GRUPO_ID: string;
}

type UpdateGrupoCamadaResponse = Either<
  Error | GrupoSiglaAlreadyExistsError,
  {
    grupo: Grupo;
  }
>;

@Injectable()
export class UpdateGrupoUseCase {
  constructor(private grupoRepository: GrupoRepository) {}

  async execute({
    COD_GRUPO_ID,
    NOM_NOME_GRUPO,
    COD_TEMA_ID,
    USUARIO_ULTIMA_ALTERACAO,
    SGL_GRUPO_ID,
  }: UpdateGrupoCamadaRequest): Promise<UpdateGrupoCamadaResponse> {
    const grupo = await this.grupoRepository.findById(COD_GRUPO_ID.toString());
    if (!grupo) {
      throw new Error('Grupo not found');
    }

    const sigla = SGL_GRUPO_ID.trim().toUpperCase();
    if (sigla !== grupo.grupoSigla) {
      const grupoWithSameSigla = await this.grupoRepository.findBySigla(sigla);
      if (grupoWithSameSigla) {
        return left(new GrupoSiglaAlreadyExistsError(sigla));
      }
      grupo.setGrupoSigla(sigla);
    }

    grupo.setGrupoNome(NOM_NOME_GRUPO);
    grupo.setGrupoTema(COD_TEMA_ID);

    if (USUARIO_ULTIMA_ALTERACAO) {
      grupo.setGrupoUsuarioAlteracao(USUARIO_ULTIMA_ALTERACAO);
    }
    await this.grupoRepository.save(grupo);

    return right({
      grupo,
    });
  }
}
