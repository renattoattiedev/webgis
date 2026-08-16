import { SicatImovelHidrometroDetalhado } from '@/domain/sicat/enterprise/entities/sicat-imovel-hidrometro-detalhado';

export class SicatImovelHidrometroDetalhadoPresenter {
  static toHTTP(imovelDetalhado: SicatImovelHidrometroDetalhado) {
    return {
      matriculaImovel: imovelDetalhado.matricula_imovel,
      codigoHidrometro: imovelDetalhado.codigo_hidrometro,
      nomeClienteInterno: imovelDetalhado.nome_cliente_interno,
      siglaLogradouro: imovelDetalhado.sigla_logradouro,
      descricaoLogradouro: imovelDetalhado.dc_logradouro,
      numeroEndereco: imovelDetalhado.numero_endereco,
      descricaoBairro: imovelDetalhado.dc_bairro,
      descricaoCidade: imovelDetalhado.dc_cidade,
      enderecoCompleto: `${imovelDetalhado.sigla_logradouro || ''} ${
        imovelDetalhado.dc_logradouro || ''
      }, ${imovelDetalhado.numero_endereco || 'S/N'} - ${
        imovelDetalhado.dc_bairro || ''
      }, ${imovelDetalhado.dc_cidade || ''}`.trim(),
    };
  }
}
