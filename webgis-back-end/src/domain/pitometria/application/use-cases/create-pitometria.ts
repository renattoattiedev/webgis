import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import {
  Pitometria,
  TipoPitometria,
} from '../../enterprise/entities/pitometria';
import { PitometriaRepository } from '../repositories/pitometria-repository';

interface CreatePitometriaUseCaseRequest {
  COD_SIMP: string;
  MATRICULA: string;
  TIPO: TipoPitometria;
  longitude: number;
  latitude: number;
  COD_USUARIO_CRIACAO: string;
}

type CreatePitometriaUseCaseResponse = Either<
  Error,
  { pitometria: Pitometria }
>;

@Injectable()
export class CreatePitometriaUseCase {
  constructor(private pitometriaRepository: PitometriaRepository) {}

  async execute({
    COD_SIMP,
    MATRICULA,
    TIPO,
    longitude,
    latitude,
    COD_USUARIO_CRIACAO,
  }: CreatePitometriaUseCaseRequest): Promise<CreatePitometriaUseCaseResponse> {
    const pitometria = Pitometria.create({
      COD_SIMP,
      MATRICULA,
      TIPO,
      longitude,
      latitude,
      COD_USUARIO_CRIACAO,
      DHS_CRIACAO: new Date(),
    });

    await this.pitometriaRepository.create(pitometria, longitude, latitude);

    return right({ pitometria });
  }
}
