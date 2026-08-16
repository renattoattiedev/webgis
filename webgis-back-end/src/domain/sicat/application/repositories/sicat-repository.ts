import { SicatBairro } from '../../enterprise/entities/sicat-bairro';
import { SicatCidade } from '../../enterprise/entities/sicat-cidades';
import { SicatLogradouro } from '../../enterprise/entities/sicat-logradouro';
import { SicatCliente } from '../../enterprise/entities/sicat-cliente';
import { SicatImovel } from '../../enterprise/entities/sicat-imovel';
import { SicatHidrometroImovel } from '../../enterprise/entities/sicat-hidrometro-imovel';
import { SicatImovelHidrometroDetalhado } from '../../enterprise/entities/sicat-imovel-hidrometro-detalhado';
import { SicatImovelMatriculaDetalhada } from '../../enterprise/entities/sicat-imovel-matricula-detalhada';

export abstract class SicatRepository {
  abstract findManyCidades(): Promise<SicatCidade[]>;
  abstract findManyBairros(cd_cidades: number[]): Promise<SicatBairro[]>;
  abstract findManyLogradouros(
    cd_cidades: number[],
  ): Promise<SicatLogradouro[]>;
  abstract findManyClientes(): Promise<SicatCliente[]>;
  abstract findManyImoveis(): Promise<SicatImovel[]>;
  abstract findClienteById(cd_cliente: number): Promise<SicatCliente | null>;
  abstract findImovelByMatricula(
    matricula_imovel: number,
  ): Promise<SicatImovelMatriculaDetalhada | null>;
  abstract findHidrometrosByMatricula(
    matricula_imovel: number,
  ): Promise<SicatHidrometroImovel[]>;
  abstract findManyHidrometrosImoveis(): Promise<SicatHidrometroImovel[]>;
  abstract findImovelDetalhadoByCodigoHidrometro(
    codigo_hidrometro: string,
  ): Promise<SicatImovelHidrometroDetalhado | null>;
}
