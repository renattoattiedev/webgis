import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import {
  Pitometria,
  TipoPitometria,
} from '../../enterprise/entities/pitometria';
import { PitometriaRepository } from '../repositories/pitometria-repository';

interface UpdatePitometriaUseCaseRequest {
  id: string;
  COD_SIMP: string;
  MATRICULA: string;
  TIPO: TipoPitometria;
  COD_USUARIO_ATUALIZACAO: string;
}

type UpdatePitometriaUseCaseResponse = Either<
  Error,
  { pitometria: Pitometria }
>;

@Injectable()
export class UpdatePitometriaUseCase {
  constructor(private pitometriaRepository: PitometriaRepository) {}

  async execute({
    id,
    COD_SIMP,
    MATRICULA,
    TIPO,
    COD_USUARIO_ATUALIZACAO,
  }: UpdatePitometriaUseCaseRequest): Promise<UpdatePitometriaUseCaseResponse> {
    const pitometria = await this.pitometriaRepository.findById(id);

    if (!pitometria) {
      return left(new Error('Medição de pitometria não encontrada'));
    }

    pitometria.setCampos(COD_SIMP, MATRICULA, TIPO, COD_USUARIO_ATUALIZACAO);
    await this.pitometriaRepository.save(pitometria);

    return right({ pitometria });
  }
}
