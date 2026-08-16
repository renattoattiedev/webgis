import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { PitometriaRepository } from '../repositories/pitometria-repository';

interface UpdatePitometriaGeometryUseCaseRequest {
  id: string;
  longitude: number;
  latitude: number;
  COD_USUARIO_ATUALIZACAO: string;
}

type UpdatePitometriaGeometryUseCaseResponse = Either<Error, void>;

@Injectable()
export class UpdatePitometriaGeometryUseCase {
  constructor(private pitometriaRepository: PitometriaRepository) {}

  async execute({
    id,
    longitude,
    latitude,
    COD_USUARIO_ATUALIZACAO,
  }: UpdatePitometriaGeometryUseCaseRequest): Promise<UpdatePitometriaGeometryUseCaseResponse> {
    const exists = await this.pitometriaRepository.findById(id);

    if (!exists) {
      return left(new Error('Medição de pitometria não encontrada'));
    }

    await this.pitometriaRepository.saveGeometria(
      id,
      longitude,
      latitude,
      COD_USUARIO_ATUALIZACAO,
    );

    return right(undefined);
  }
}
