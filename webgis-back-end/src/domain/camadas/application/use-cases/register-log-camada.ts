import { Injectable } from '@nestjs/common';
import { CamadasLog } from '../../enterprise/entities/camadas-log';
import { Either, right } from '@/core/either';
import { CamadasLogRepository } from '../repositories/camadas-logs-repository';

interface RegisterLogCamadaUseCaseRequest {
  COD_CAMADA_ID: string;
}
type RegisterLogCamadaUseCaseResponse = Either<
  null,
  {
    camadaLog: CamadasLog;
  }
>;
@Injectable()
export class RegisterLogCamadaUseCase {
  constructor(private camadasLogRepository: CamadasLogRepository) {}
  async execute({
    COD_CAMADA_ID,
  }: RegisterLogCamadaUseCaseRequest): Promise<RegisterLogCamadaUseCaseResponse> {
    const camadaLog = CamadasLog.create({
      COD_CAMADA_ID,
      DHS_ACESSO: new Date(),
    });

    await this.camadasLogRepository.create(camadaLog);

    return right({
      camadaLog,
    });
  }
}
