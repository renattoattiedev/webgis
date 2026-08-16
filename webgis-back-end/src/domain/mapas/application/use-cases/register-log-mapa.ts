import { Injectable } from '@nestjs/common';
import { MapasLog } from '../../enterprise/entities/mapas-log';
import { Either, right } from '@/core/either';
import { MapasLogRepository } from '../repositories/mapas-logs-repository';

interface RegisterLogMapaUseCaseRequest {
  COD_MAPA_ID: string;
}
type RegisterLogMapaUseCaseResponse = Either<
  null,
  {
    MapaLog: MapasLog;
  }
>;
@Injectable()
export class RegisterLogMapaUseCase {
  constructor(private mapasLogRepository: MapasLogRepository) {}
  async execute({
    COD_MAPA_ID,
  }: RegisterLogMapaUseCaseRequest): Promise<RegisterLogMapaUseCaseResponse> {
    const MapaLog = MapasLog.create({
      COD_MAPA_ID,
      DHS_ACESSO: new Date(),
    });

    await this.mapasLogRepository.create(MapaLog);

    return right({
      MapaLog,
    });
  }
}
