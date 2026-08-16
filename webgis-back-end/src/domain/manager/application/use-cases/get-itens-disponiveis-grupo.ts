import { Injectable } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { CamadasRepository } from '@/domain/camadas/application/repositories/camadas-repository';
import { CamadasRasterRepository } from '@/domain/camadas-raster/application/repositories/camadas-raster-repository';
import { MapasRepository } from '@/domain/mapas/application/repositories/mapas-repository';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';
import { Mapas } from '@/domain/mapas/enterprise/entities/mapas';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';
import { GrupoItensAdicionaisRepository } from '../repositories/grupo-itens-adicionais-repository';

interface GetItensDisponiveisGrupoUseCaseRequest {
  grupoId: string;
  requesterId: string;
  perfilRequester: string | null;
}

type GetItensDisponiveisGrupoUseCaseResponse = Either<
  null,
  {
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }
>;

@Injectable()
export class GetItensDisponiveisGrupoUseCase {
  constructor(
    private camadasRepository: CamadasRepository,
    private camadasRasterRepository: CamadasRasterRepository,
    private mapasRepository: MapasRepository,
    private policy: GrupoAccessPolicy,
    private grupoItensAdicionaisRepository: GrupoItensAdicionaisRepository,
  ) {}

  async execute({
    grupoId,
    requesterId,
    perfilRequester,
  }: GetItensDisponiveisGrupoUseCaseRequest): Promise<GetItensDisponiveisGrupoUseCaseResponse> {
    const ctx = await this.policy.buildContext(requesterId, perfilRequester);

    const [todasCamadas, todosRasters, todosMapas] = await Promise.all([
      this.camadasRepository.findManyAtivas(),
      this.camadasRasterRepository.findManyAtivas(),
      this.mapasRepository.findManyByMapas(),
    ]);

    const [vinculadasCamada, vinculadasRaster, vinculadasMapa] =
      await Promise.all([
        this.grupoItensAdicionaisRepository.findItemIdsByGrupo(
          'camada',
          grupoId,
        ),
        this.grupoItensAdicionaisRepository.findItemIdsByGrupo(
          'raster',
          grupoId,
        ),
        this.grupoItensAdicionaisRepository.findItemIdsByGrupo('mapa', grupoId),
      ]);
    const vinculadasCamadaSet = new Set(vinculadasCamada);
    const vinculadasRasterSet = new Set(vinculadasRaster);
    const vinculadasMapaSet = new Set(vinculadasMapa);

    const camadas = todasCamadas.filter(
      (c) =>
        c.camadaGruposCamadas !== grupoId &&
        !vinculadasCamadaSet.has(c.id.toString()) &&
        this.policy.canEditGroupContentByGrupoId(
          ctx,
          c.camadaGruposCamadas,
          c.camadaUsuarioCriacao,
        ),
    );

    const camadasRaster = todosRasters.filter(
      (c) =>
        c.camadaGruposCamadas !== grupoId &&
        !vinculadasRasterSet.has(c.id.toString()) &&
        this.policy.canEditGroupContentByGrupoId(
          ctx,
          c.camadaGruposCamadas,
          c.camadaUsuarioCriacao,
        ),
    );

    const mapas = todosMapas.filter(
      (m) =>
        m.mapaGrupo !== grupoId &&
        !vinculadasMapaSet.has(m.id.toString()) &&
        this.policy.canEditGroupContentByGrupoId(
          ctx,
          m.mapaGrupo,
          m.mapaUsuarioCriacao,
        ),
    );

    return right({ camadas, camadasRaster, mapas });
  }
}
