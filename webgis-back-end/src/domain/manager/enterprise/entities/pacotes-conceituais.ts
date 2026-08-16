import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface PacotesConceituaisProps {
  NOM_NOME_PACOTE_CONCEITUAL: string;
  DSC_TITULO: string;
  DSC_HOST: string;
  DSC_PORT: string;
  DSC_DATABASE: string;
  DSC_SCHEMA: string;
  DSC_USER: string;
  DSC_PASSWORD: string;
  USUARIO_CRIACAO: string;
  DHS_INCLUSAO: Date;
  DHS_ULTIMA_ALTERACAO?: Date | null;
  USUARIO_ULTIMA_ALTERACAO?: string | null;
}

export class PacotesConceituais extends Entity<PacotesConceituaisProps> {
  get pacoteConceitualNome() {
    return this.props.NOM_NOME_PACOTE_CONCEITUAL;
  }

  get pacoteConceitualTitulo() {
    return this.props.DSC_TITULO;
  }

  get pacoteConceitualHost() {
    return this.props.DSC_HOST;
  }

  get pacoteConceitualPort() {
    return this.props.DSC_PORT;
  }

  get pacoteConceitualDatabase() {
    return this.props.DSC_DATABASE;
  }

  get pacoteConceitualSchema() {
    return this.props.DSC_SCHEMA;
  }

  get pacoteConceitualUser() {
    return this.props.DSC_USER;
  }

  get pacoteConceitualPassword() {
    return this.props.DSC_PASSWORD;
  }

  get pacoteConceitualUsuarioCriacao(): string {
    return this.props.USUARIO_CRIACAO;
  }

  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  get updatedAt() {
    return this.props.DHS_ULTIMA_ALTERACAO;
  }

  get pacoteConceitualUsuarioAlteracao(): string {
    return this.props.USUARIO_ULTIMA_ALTERACAO ?? '';
  }

  private touch() {
    this.props.DHS_ULTIMA_ALTERACAO = new Date();
  }

  setPacoteConceitualNome(pacoteConceitualNome: string) {
    this.props.NOM_NOME_PACOTE_CONCEITUAL = pacoteConceitualNome;
    this.touch();
  }

  setPacoteConceitualTitulo(pacoteConceitualTitulo: string) {
    this.props.DSC_TITULO = pacoteConceitualTitulo;
    this.touch();
  }

  setPacoteConceitualHost(pacoteConceitualHost: string) {
    this.props.DSC_HOST = pacoteConceitualHost;
    this.touch();
  }

  setPacoteConceitualPort(pacoteConceitualPort: string) {
    this.props.DSC_PORT = pacoteConceitualPort;
    this.touch();
  }

  setPacoteConceitualDatabase(pacoteConceitualDatabase: string) {
    this.props.DSC_DATABASE = pacoteConceitualDatabase;
    this.touch();
  }

  setPacoteConceitualSchema(pacoteConceitualSchema: string) {
    this.props.DSC_SCHEMA = pacoteConceitualSchema;
    this.touch();
  }

  setPacoteConceitualUser(pacoteConceitualUser: string) {
    this.props.DSC_USER = pacoteConceitualUser;
    this.touch();
  }

  setPacoteConceitualPassword(pacoteConceitualPassword: string) {
    this.props.DSC_PASSWORD = pacoteConceitualPassword;
    this.touch();
  }

  setPacoteConceitualUsuarioCriacao(pacoteConceitualUsuarioCriacao: string) {
    this.props.USUARIO_CRIACAO = pacoteConceitualUsuarioCriacao;
    this.touch();
  }

  setPacoteConceitualUsuarioUltimaAlteracao(
    pacoteConceitualUsuarioUltimaAlteracao: string,
  ) {
    this.props.USUARIO_ULTIMA_ALTERACAO =
      pacoteConceitualUsuarioUltimaAlteracao;
    this.touch();
  }

  // 🆕 Lista dos campos sensíveis
  private static SENSITIVE_FIELDS = [
    'DSC_HOST',
    'DSC_PORT',
    'DSC_DATABASE',
    'DSC_SCHEMA',
    'DSC_USER',
    'DSC_PASSWORD',
  ];

  // 🆕 Verificar se um campo é sensível
  isFieldSensitive(fieldName: string): boolean {
    return PacotesConceituais.SENSITIVE_FIELDS.includes(fieldName);
  }

  // 🆕 Obter valor mascarado de um campo sensível
  getSensitiveFieldMasked(fieldName: string): string {
    if (!this.isFieldSensitive(fieldName)) {
      return (this.props as any)[fieldName] || '';
    }

    const value = (this.props as any)[fieldName] || '';

    switch (fieldName) {
      case 'DSC_HOST':
        return this.maskHost(value);
      case 'DSC_PASSWORD':
        return this.maskPassword(value);
      case 'DSC_USER':
        return this.maskUsername(value);
      case 'DSC_PORT':
        return value; // Port pode ser menos sensível
      default:
        return this.maskGeneric(value);
    }
  }

  // 🆕 Obter todos os dados de conexão mascarados
  getConnectionDataMasked() {
    return {
      host: this.getSensitiveFieldMasked('DSC_HOST'),
      port: this.pacoteConceitualPort,
      database: this.getSensitiveFieldMasked('DSC_DATABASE'),
      schema: this.pacoteConceitualSchema,
      user: this.getSensitiveFieldMasked('DSC_USER'),
      password: this.getSensitiveFieldMasked('DSC_PASSWORD'),
    };
  }

  // 🆕 Obter todos os dados de conexão reais
  getConnectionDataReal() {
    return {
      host: this.pacoteConceitualHost,
      port: this.pacoteConceitualPort,
      database: this.pacoteConceitualDatabase,
      schema: this.pacoteConceitualSchema,
      user: this.pacoteConceitualUser,
      password: this.pacoteConceitualPassword,
    };
  }

  private maskHost(host: string): string {
    if (!host) return '';
    const parts = host.split('.');
    if (parts.length > 1) {
      return `${parts[0]}.***.${parts[parts.length - 1]}`;
    }
    return host.substring(0, 2) + '***' + host.slice(-2);
  }

  private maskPassword(password: string): string {
    if (!password) return '';
    return '*'.repeat(Math.min(password.length, 8));
  }

  private maskUsername(username: string): string {
    if (!username || username.length <= 2) return '***';
    return username[0] + '*'.repeat(username.length - 2) + username.slice(-1);
  }

  private maskGeneric(value: string): string {
    if (!value || value.length <= 4) return '*'.repeat(value?.length || 4);
    return (
      value.substring(0, 2) +
      '*'.repeat(value.length - 4) +
      value.substring(value.length - 2)
    );
  }

  static create(props: PacotesConceituaisProps, id?: UniqueEntityID) {
    const pacotesConceituais = new PacotesConceituais(props, id);

    return pacotesConceituais;
  }
}
