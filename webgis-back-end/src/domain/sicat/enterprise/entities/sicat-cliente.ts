import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface SicatClienteProps {
  nome_cliente_interno?: string | null;
  cpf_cnpj?: string | null;
  cd_cliente: number;
  tipo_cliente?: string | null;
}

export class SicatCliente extends Entity<SicatClienteProps> {
  get nomeClienteInterno() {
    return this.props.nome_cliente_interno;
  }

  get cpfCnpj() {
    return this.props.cpf_cnpj;
  }

  get codigoCliente() {
    return this.props.cd_cliente;
  }

  get tipoCliente() {
    return this.props.tipo_cliente;
  }

  static create(props: SicatClienteProps, id?: UniqueEntityID) {
    const sicatCliente = new SicatCliente(
      {
        ...props,
      },
      id,
    );

    return sicatCliente;
  }
}
