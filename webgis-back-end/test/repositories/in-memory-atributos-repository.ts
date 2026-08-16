import { AtributosRepository } from '@/domain/camadas/application/repositories/atributo-repository';
import { Atributos } from '@/domain/camadas/enterprise/entities/atributos';

export class InMemoryAtributosRepository implements AtributosRepository {
  public itens: Atributos[] = [];

  async findById(COD_ATRIBUTO_ID: string): Promise<Atributos | null> {
    return this.itens.find((a) => a.id.toString() === COD_ATRIBUTO_ID) ?? null;
  }

  async findByNome(NOM_NOME_ATRIBUTO: string): Promise<Atributos | null> {
    return this.itens.find((a) => a.atributoNome === NOM_NOME_ATRIBUTO) ?? null;
  }

  async findManyByAtributosCamadasId(
    COD_CAMADA_ID: string,
    manager = false,
  ): Promise<Atributos[]> {
    return this.itens.filter(
      (a) =>
        a.camadaId === COD_CAMADA_ID &&
        a.atributoNome !== 'id' &&
        !a.atributoExcluido &&
        (manager || a.atributoVisivel),
    );
  }

  async findAllByCamadaId(COD_CAMADA_ID: string): Promise<Atributos[]> {
    return this.itens.filter((a) => a.camadaId === COD_CAMADA_ID);
  }

  async create(atributo: Atributos): Promise<void> {
    this.itens.push(atributo);
  }

  async save(atributo: Atributos): Promise<void> {
    const index = this.itens.findIndex(
      (a) => a.id.toString() === atributo.id.toString(),
    );
    if (index >= 0) {
      this.itens[index] = atributo;
    }
  }
}
