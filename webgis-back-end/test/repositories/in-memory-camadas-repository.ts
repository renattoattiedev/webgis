import { CamadasRepository } from '@/domain/camadas/application/repositories/camadas-repository';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';

export class InMemoryCamadasRepository implements CamadasRepository {
  public itens: Camadas[] = [];

  async findById(COD_CAMADA_ID: string): Promise<Camadas | null> {
    return this.itens.find((c) => c.id.toString() === COD_CAMADA_ID) ?? null;
  }

  async findByNome(NOM_NOME: string): Promise<Camadas | null> {
    return this.itens.find((c) => c.camadaNome === NOM_NOME) ?? null;
  }

  async findManyByCamadasId(NOM_NOME: string): Promise<Camadas[]> {
    return this.itens.filter((c) => c.camadaNome === NOM_NOME);
  }

  async findPacoteConceitual(NOM_NOME: string): Promise<string | null> {
    const camada = this.itens.find((c) => c.camadaNome === NOM_NOME);
    return camada?.camadaPacotesConceituais ?? null;
  }

  async findManyByCamadasUserId(
    COD_USUARIO_CRIACAO: string,
  ): Promise<Camadas[]> {
    return this.itens.filter(
      (c) => c.camadaUsuarioCriacao === COD_USUARIO_CRIACAO,
    );
  }

  async findManyByCamadasGrupoId(COD_GRUPO_ID: string): Promise<Camadas[]> {
    return this.itens.filter((c) => c.camadaGruposCamadas === COD_GRUPO_ID);
  }

  async findManyAtivas(): Promise<Camadas[]> {
    return this.itens.filter((c) => c.camadaAtiva);
  }

  async findManyByPacoteConceitual(
    COD_PACOTE_CONCEITUAL_ID: string,
  ): Promise<Camadas[]> {
    return this.itens.filter(
      (c) => c.camadaPacotesConceituais === COD_PACOTE_CONCEITUAL_ID,
    );
  }

  async create(camada: Camadas): Promise<void> {
    this.itens.push(camada);
  }

  async save(camada: Camadas): Promise<void> {
    const idx = this.itens.findIndex((c) => c.id.equals(camada.id));
    if (idx >= 0) this.itens[idx] = camada;
  }

  async changeOwner(): Promise<void> {
    return;
  }

  async deleteCamada(): Promise<void> {
    return;
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

  async findComponentsAssociatedWithCamada(): Promise<
    Array<{ COD_COMPONENTE_ID: string; NOM_NOME_COMPONENTE: string }>
  > {
    return [];
  }
}
