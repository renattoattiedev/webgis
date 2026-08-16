import { Injectable } from '@nestjs/common';
import { AtributosRepository } from '../repositories/atributo-repository';
import { Atributos } from '../../enterprise/entities/atributos';
import { AtributoAlterado } from '../repositories/publicacao-historico-repository';

export interface ColunaTabela {
  column_name: string;
  data_type: string;
  character_maximum_length: number | null;
}

interface ReconciliarAtributosRequest {
  COD_CAMADA_ID: string;
  colunas: ColunaTabela[];
  COD_USUARIO: string;
}

export interface ResumoReconciliacao {
  atributosAdicionados: string[];
  atributosRemovidos: string[];
  atributosAlterados: AtributoAlterado[];
}

@Injectable()
export class ReconciliarAtributosService {
  constructor(private atributosRepository: AtributosRepository) {}

  async execute({
    COD_CAMADA_ID,
    colunas,
    COD_USUARIO,
  }: ReconciliarAtributosRequest): Promise<ResumoReconciliacao> {
    const existentes =
      await this.atributosRepository.findAllByCamadaId(COD_CAMADA_ID);
    const porNome = new Map(existentes.map((a) => [a.atributoNome, a]));
    const nomesNoBanco = new Set(colunas.map((c) => c.column_name));

    const atributosAdicionados: string[] = [];
    const atributosRemovidos: string[] = [];
    const atributosAlterados: AtributoAlterado[] = [];

    for (const coluna of colunas) {
      const atributo = porNome.get(coluna.column_name);
      const tamanho = coluna.character_maximum_length ?? 0;

      if (!atributo) {
        await this.atributosRepository.create(
          Atributos.create({
            COD_CAMADA_ID,
            NOM_NOME_ATRIBUTO: coluna.column_name,
            DSC_LABEL_ATRIBUTO: '',
            DSC_TIPO: coluna.data_type,
            NUM_TAMANHO: tamanho,
            FLG_VISIVEL: true,
            TXT_DESCRICAO: '',
            COD_USUARIO_CRIACAO: COD_USUARIO,
            DHS_INCLUSAO: new Date(),
          }),
        );
        atributosAdicionados.push(coluna.column_name);
        continue;
      }

      const tipoAnterior = atributo.atributoTipo;
      const foiReativado = atributo.atributoExcluido;

      if (foiReativado) {
        atributo.restaurar(COD_USUARIO);
        atributosAdicionados.push(coluna.column_name);
      } else if (tipoAnterior !== coluna.data_type) {
        atributosAlterados.push({
          nome: coluna.column_name,
          tipoAnterior,
          tipoNovo: coluna.data_type,
        });
      }

      atributo.setAtributoTipo(coluna.data_type);
      atributo.setAtributoTamanho(tamanho);
      atributo.setAtributoUsuarioUltimaAlteracao(COD_USUARIO);

      await this.atributosRepository.save(atributo);
    }

    for (const atributo of existentes) {
      if (nomesNoBanco.has(atributo.atributoNome)) continue;
      if (atributo.atributoExcluido) continue;

      atributo.excluir(COD_USUARIO);
      await this.atributosRepository.save(atributo);
      atributosRemovidos.push(atributo.atributoNome);
    }

    return { atributosAdicionados, atributosRemovidos, atributosAlterados };
  }
}
