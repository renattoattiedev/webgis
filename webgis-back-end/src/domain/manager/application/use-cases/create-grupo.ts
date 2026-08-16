import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Grupo } from '../../enterprise/entities/grupo';
import { GrupoCamadaAlreadyExistsError } from './errors/grupo-camada-already-exists-error';
import { GrupoSiglaAlreadyExistsError } from './errors/grupo-sigla-already-exists-error';
import { GrupoRepository } from '../repositories/grupo-repository';
import { gerarSiglaSugerida } from './utils/gerar-sigla-sugerida';

interface GrupoUseCaseRequest {
  COD_GRUPO_CAMADA_ID: UniqueEntityID;
  NOM_NOME_GRUPO: string;
  COD_TEMA_ID: string;
  USUARIO_CRIACAO: string;
  DHS_INCLUSAO: Date;
  COD_USUARIO_DONO?: string;
  SGL_GRUPO_ID?: string;
}

type GrupoUseCaseResponse = Either<
  GrupoCamadaAlreadyExistsError | GrupoSiglaAlreadyExistsError,
  {
    grupo: Grupo;
  }
>;

@Injectable()
export class CreateGrupoUseCase {
  constructor(private grupoRepository: GrupoRepository) {}

  async execute({
    NOM_NOME_GRUPO,
    COD_TEMA_ID,
    USUARIO_CRIACAO,
    DHS_INCLUSAO,
    COD_USUARIO_DONO,
    SGL_GRUPO_ID,
  }: GrupoUseCaseRequest): Promise<GrupoUseCaseResponse> {
    const grupoWithSameNome =
      await this.grupoRepository.findByNome(NOM_NOME_GRUPO);

    if (grupoWithSameNome) {
      return left(new GrupoCamadaAlreadyExistsError(NOM_NOME_GRUPO));
    }

    let sigla = SGL_GRUPO_ID?.trim().toUpperCase();

    if (sigla) {
      const grupoWithSameSigla = await this.grupoRepository.findBySigla(sigla);
      if (grupoWithSameSigla) {
        return left(new GrupoSiglaAlreadyExistsError(sigla));
      }
    } else {
      const gruposAtivos = await this.grupoRepository.findManyAtivos();
      const siglasExistentes = new Set(gruposAtivos.map((g) => g.grupoSigla));
      sigla = gerarSiglaSugerida(NOM_NOME_GRUPO, siglasExistentes);
    }

    const grupo = Grupo.create({
      NOM_NOME_GRUPO,
      SGL_GRUPO_ID: sigla,
      COD_TEMA_ID,
      USUARIO_CRIACAO,
      DHS_INCLUSAO,
      USUARIO_ALTERACAO: null,
      USUARIO_DONO: COD_USUARIO_DONO ?? USUARIO_CRIACAO,
    });

    await this.grupoRepository.create(grupo);

    return right({
      grupo,
    });
  }
}
