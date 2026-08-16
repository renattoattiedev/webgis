import { Injectable } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { CamadasRasterRepository } from '@/domain/camadas-raster/application/repositories/camadas-raster-repository';

interface CheckRequest {
  relativePath: string;
}

interface CheckResponse {
  alreadyPublished: boolean;
  camadaId?: string;
}

@Injectable()
export class CheckRasterAlreadyPublishedUseCase {
  constructor(private readonly camadasRepo: CamadasRasterRepository) {}

  async execute(req: CheckRequest): Promise<Either<never, CheckResponse>> {
    const camada = await this.camadasRepo.findByFonte(req.relativePath);
    if (!camada) return right({ alreadyPublished: false });
    return right({ alreadyPublished: true, camadaId: camada.id.toString() });
  }
}
