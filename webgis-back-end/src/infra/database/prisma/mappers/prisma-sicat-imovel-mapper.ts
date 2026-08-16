import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { SicatImovel } from '@/domain/sicat/enterprise/entities/sicat-imovel';
import { SicatImovel as PrismaSicatImovel } from '@prisma/client';

export class PrismaSicatImovelMapper {
  static toDomain(raw: PrismaSicatImovel): SicatImovel {
    return SicatImovel.create(
      {
        matricula_imovel: Number(raw.matricula_imovel),
        dv: raw.dv ? Number(raw.dv) : null,
        cliente_especial: raw.cliente_especial?.toString().trim() || null,
        data_ligacao_agua: raw.data_ligacao_agua
          ? new Date(Number(raw.data_ligacao_agua))
          : null,
        data_ligacao_esgoto: raw.data_ligacao_esgoto
          ? new Date(Number(raw.data_ligacao_esgoto))
          : null,
        numero_economias: raw.numero_economias
          ? Number(raw.numero_economias)
          : null,
        tratamento_esgoto: raw.tratamento_esgoto?.toString().trim() || null,
        ciclo_leitura: raw.ciclo_leitura ? Number(raw.ciclo_leitura) : null,
        seq_rota: raw.seq_rota ? Number(raw.seq_rota) : null,
        cep: raw.cep ? Number(raw.cep) : null,
        cd_logradouro: raw.cd_logradouro ? Number(raw.cd_logradouro) : null,
        cd_cidade: raw.cd_cidade ? Number(raw.cd_cidade) : null,
        cd_bairro: raw.cd_bairro ? Number(raw.cd_bairro) : null,
        row_version: raw.row_version ? Number(raw.row_version) : null,
        numero_endereco: raw.numero_endereco?.toString().trim() || null,
        complemento_endereco:
          raw.complemento_endereco?.toString().trim() || null,
        grupo_consumo: raw.grupo_consumo ? Number(raw.grupo_consumo) : null,
        cd_cliente: raw.cd_cliente ? Number(raw.cd_cliente) : null,
        categoria: raw.categoria ? Number(raw.categoria) : null,
        otr_fonte: raw.otr_fonte ? Number(raw.otr_fonte) : null,
        tp_ligacao_agua: raw.tp_ligacao_agua
          ? Number(raw.tp_ligacao_agua)
          : null,
        sit_ligacao_agua: raw.sit_ligacao_agua
          ? Number(raw.sit_ligacao_agua)
          : null,
        sit_ligacao_esgoto: raw.sit_ligacao_esgoto
          ? Number(raw.sit_ligacao_esgoto)
          : null,
      },
      new UniqueEntityID(raw.matricula_imovel.toString()),
    );
  }
}
