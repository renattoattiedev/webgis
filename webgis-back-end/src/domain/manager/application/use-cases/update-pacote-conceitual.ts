import { Injectable } from '@nestjs/common';
import { PacotesConceituaisRepository } from '../repositories/pacotes-conceituais-repository';
import { Either, right } from '@/core/either';
import { PacotesConceituais } from '../../enterprise/entities/pacotes-conceituais';

interface UpdatePacoteConceitualRequest {
  COD_PACOTE_CONCEITUAL_ID: string;
  NOM_NOME_PACOTE_CONCEITUAL: string;
  DSC_TITULO: string;
  DSC_HOST: string;
  DSC_PORT: string;
  DSC_DATABASE: string;
  DSC_SCHEMA: string;
  DSC_USER: string;
  DSC_PASSWORD: string;
  USUARIO_ULTIMA_ALTERACAO: string;
}

type PacoteConceitualCamadaUseCaseResponse = Either<
  Error,
  {
    pacoteConceitual: PacotesConceituais;
  }
>;

@Injectable()
export class UpdatePacoteConceitualUseCase {
  constructor(
    private pacotesConceituaisRepository: PacotesConceituaisRepository,
  ) {}

  async execute({
    COD_PACOTE_CONCEITUAL_ID,
    NOM_NOME_PACOTE_CONCEITUAL,
    DSC_TITULO,
    DSC_HOST,
    DSC_PORT,
    DSC_DATABASE,
    DSC_SCHEMA,
    DSC_USER,
    DSC_PASSWORD,
    USUARIO_ULTIMA_ALTERACAO,
  }: UpdatePacoteConceitualRequest): Promise<PacoteConceitualCamadaUseCaseResponse> {
    const pacoteConceitual = await this.pacotesConceituaisRepository.findById(
      COD_PACOTE_CONCEITUAL_ID.toString(),
    );
    if (!pacoteConceitual) {
      throw new Error('Pacote Conceitual not found');
    }

    pacoteConceitual.setPacoteConceitualNome(NOM_NOME_PACOTE_CONCEITUAL);
    pacoteConceitual.setPacoteConceitualTitulo(DSC_TITULO);
    pacoteConceitual.setPacoteConceitualHost(DSC_HOST);
    pacoteConceitual.setPacoteConceitualPort(DSC_PORT);
    pacoteConceitual.setPacoteConceitualDatabase(DSC_DATABASE);
    pacoteConceitual.setPacoteConceitualSchema(DSC_SCHEMA);
    pacoteConceitual.setPacoteConceitualUser(DSC_USER);
    pacoteConceitual.setPacoteConceitualPassword(DSC_PASSWORD);

    if (USUARIO_ULTIMA_ALTERACAO) {
      pacoteConceitual.setPacoteConceitualUsuarioUltimaAlteracao(
        USUARIO_ULTIMA_ALTERACAO,
      );
    }
    await this.pacotesConceituaisRepository.save(pacoteConceitual);

    return right({
      pacoteConceitual,
    });
  }
}
