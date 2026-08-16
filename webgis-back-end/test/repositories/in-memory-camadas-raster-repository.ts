import { CamadasRasterRepository } from '@/domain/camadas-raster/application/repositories/camadas-raster-repository';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';

export class InMemoryCamadasRasterRepository
  implements CamadasRasterRepository
{
  items: CamadasRaster[] = [];

  async findById(id: string): Promise<CamadasRaster | null> {
    return this.items.find((c) => c.id.toString() === id) ?? null;
  }

  async findByNome(NOM_NOME: string): Promise<CamadasRaster | null> {
    return this.items.find((c) => c.camadaNome === NOM_NOME) ?? null;
  }

  async findByNomeFonte(
    NOM_NOME: string,
    DSC_FONTE_DADOS_CAMADA: string,
  ): Promise<CamadasRaster | null> {
    return (
      this.items.find(
        (c) =>
          c.camadaNome === NOM_NOME &&
          c.camadaFonteDadosCamada === DSC_FONTE_DADOS_CAMADA,
      ) ?? null
    );
  }

  async findByFonte(
    DSC_FONTE_DADOS_CAMADA: string,
  ): Promise<CamadasRaster | null> {
    return (
      this.items.find(
        (c) => c.camadaFonteDadosCamada === DSC_FONTE_DADOS_CAMADA,
      ) ?? null
    );
  }

  async findManyByCamadasId(NOM_NOME: string): Promise<CamadasRaster[]> {
    return this.items.filter((c) => c.camadaNome === NOM_NOME);
  }

  async findManyByCamadasUserId(
    COD_USUARIO_CRIACAO: string,
  ): Promise<CamadasRaster[]> {
    return this.items.filter(
      (c) => c.camadaUsuarioCriacao === COD_USUARIO_CRIACAO,
    );
  }

  async findManyByCamadasGrupoId(
    COD_GRUPO_ID: string,
  ): Promise<CamadasRaster[]> {
    return this.items.filter((c) => c.camadaGruposCamadas === COD_GRUPO_ID);
  }

  async findManyAtivas(): Promise<CamadasRaster[]> {
    return this.items.filter((c) => c.camadaAtiva);
  }

  async create(camada: CamadasRaster): Promise<void> {
    this.items.push(camada);
  }

  async save(camada: CamadasRaster): Promise<void> {
    const idx = this.items.findIndex(
      (c) => c.id.toString() === camada.id.toString(),
    );
    if (idx >= 0) this.items[idx] = camada;
  }

  async changeOwner(): Promise<void> {
    return;
  }

  async deleteCamada(id: string): Promise<void> {
    this.items = this.items.filter((c) => c.id.toString() !== id);
  }

  async recoveryCamada(): Promise<void> {
    return;
  }

  async deactivateCamada(): Promise<void> {
    return;
  }

  async activateCamada(): Promise<void> {
    return;
  }
}
