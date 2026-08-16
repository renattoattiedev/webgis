import {
  PublicacaoHistoricoRepository,
  RegistroPublicacao,
} from '@/domain/camadas/application/repositories/publicacao-historico-repository';

export class InMemoryPublicacaoHistoricoRepository
  implements PublicacaoHistoricoRepository
{
  public registros: RegistroPublicacao[] = [];

  async registrar(registro: RegistroPublicacao): Promise<void> {
    this.registros.push(registro);
  }
}
