import { PerfilRepository } from '@/domain/security/application/repositories/perfil-repository';
import { Perfil } from '@/domain/security/enterprise/entities/perfil';

export class InMemoryPerfilRepository implements PerfilRepository {
  public itens: Perfil[] = [];

  async findById(COD_PERFIL_USER: string): Promise<Perfil | null> {
    return this.itens.find((p) => p.id.toString() === COD_PERFIL_USER) ?? null;
  }

  async findByPerfil(DSC_PERFIL: string): Promise<Perfil | null> {
    return this.itens.find((p) => p.descricaoPerfil === DSC_PERFIL) ?? null;
  }

  async findManyPerfil(): Promise<Perfil[]> {
    return this.itens;
  }

  async create(perfil: Perfil): Promise<void> {
    this.itens.push(perfil);
  }
}
