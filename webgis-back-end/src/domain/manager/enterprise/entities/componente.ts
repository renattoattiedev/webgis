import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface ComponenteProps {
  NOM_NOME_COMPONENTE: string;
  DSC_DESCRICAO?: string | null;
  JSON_CONFIGURACAO: any; // Pode ser um objeto ou string, dependendo do uso
  FLG_HABILITADO: boolean;
}

export class Componente extends Entity<ComponenteProps> {
  get nome(): string {
    return this.props.NOM_NOME_COMPONENTE;
  }

  get descricao(): string | null | undefined {
    return this.props.DSC_DESCRICAO;
  }

  get configuracao(): any {
    return this.props.JSON_CONFIGURACAO;
  }

  get habilitado(): boolean {
    return this.props.FLG_HABILITADO;
  }

  setNome(nome: string) {
    this.props.NOM_NOME_COMPONENTE = nome;
  }

  setDescricao(descricao: string | null) {
    this.props.DSC_DESCRICAO = descricao;
  }

  setConfiguracao(configuracao: any) {
    this.props.JSON_CONFIGURACAO = configuracao;
  }

  setHabilitado(habilitado: boolean) {
    this.props.FLG_HABILITADO = habilitado;
  }

  static create(props: ComponenteProps, id?: UniqueEntityID) {
    return new Componente(props, id);
  }
}
