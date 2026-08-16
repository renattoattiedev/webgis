import { Injectable } from '@nestjs/common';
import { CamadasRasterLog } from '../../enterprise/entities/camadas-raster-log';
import { Either, right } from '@/core/either';
import { CamadasRasterLogRepository } from '../repositories/camadas-raster-logs-repository';

interface RegisterLogCamadaRasterUseCaseRequest {
  COD_CAMADA_RASTER_ID: string;
}
type RegisterLogCamadaRasterUseCaseResponse = Either<
  null,
  {
    camadasRasterLog: CamadasRasterLog;
  }
>;
@Injectable()
export class RegisterLogCamadaRasterUseCase {
  constructor(private camadasRasterLogRepository: CamadasRasterLogRepository) {}

  async execute({
    COD_CAMADA_RASTER_ID,
  }: RegisterLogCamadaRasterUseCaseRequest): Promise<RegisterLogCamadaRasterUseCaseResponse> {
    const camadasRasterLog = CamadasRasterLog.create({
      COD_CAMADA_RASTER_ID,
      DHS_ACESSO: new Date(),
    });

    await this.camadasRasterLogRepository.create(camadasRasterLog);

    return right({
      camadasRasterLog,
    });
  }
}
