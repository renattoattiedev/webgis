import { CamadasRepository } from '@/domain/camadas/application/repositories/camadas-repository';
import { CamadasRasterRepository } from '@/domain/camadas-raster/application/repositories/camadas-raster-repository';
import { MapasRepository } from '@/domain/mapas/application/repositories/mapas-repository';
import { TipoItemGrupo } from '../repositories/grupo-itens-adicionais-repository';

export interface ItemGrupoResumo {
  grupoPrimarioId: string;
  criadorId: string;
}

export interface BuscarItemGrupoRepos {
  camadasRepository: CamadasRepository;
  camadasRasterRepository: CamadasRasterRepository;
  mapasRepository: MapasRepository;
}

/** Busca o grupo primário e o criador de um item, qualquer que seja o tipo — usado por AddItemToGrupoUseCase e RemoveItemFromGrupoUseCase. */
export async function buscarItemGrupo(
  tipo: TipoItemGrupo,
  itemId: string,
  repos: BuscarItemGrupoRepos,
): Promise<ItemGrupoResumo | null> {
  if (tipo === 'camada') {
    const camada = await repos.camadasRepository.findById(itemId);
    return camada
      ? {
          grupoPrimarioId: camada.camadaGruposCamadas,
          criadorId: camada.camadaUsuarioCriacao,
        }
      : null;
  }

  if (tipo === 'raster') {
    const raster = await repos.camadasRasterRepository.findById(itemId);
    return raster
      ? {
          grupoPrimarioId: raster.camadaGruposCamadas,
          criadorId: raster.camadaUsuarioCriacao,
        }
      : null;
  }

  const { mapa } = await repos.mapasRepository.findById(itemId);
  return mapa
    ? { grupoPrimarioId: mapa.mapaGrupo, criadorId: mapa.mapaUsuarioCriacao }
    : null;
}
