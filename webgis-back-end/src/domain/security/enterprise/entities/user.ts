import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface UserProps {
  NOM_USER: string;
  PERFIL_USER: string;
  DSC_EMAIL: string;
  DSC_PASSWORD: string | null;
  COD_ENTRA_OBJECT_ID: string | null;
  DSC_AUTH_PROVIDER: string;
  DHS_ULTIMA_AUTENTICACAO: Date | null;
  USUARIO_CRIACAO: string | null;
  DHS_INCLUSAO: Date;
  DHS_EXCLUSAO: Date | null;
  DHS_ULTIMA_ALTERACAO?: Date | null;
  DSC_EMAIL_VERIFICATION_TOKEN: string | null;
  DSC_EMAIL_VERIFICATION_EXPIRES: Date | null;
  BOL_EMAIL_VERIFIED: boolean | false;
  DSC_RESET_PASSWORD_TOKEN: string | null;
  DHS_EXPIRES_RESET_PASSWORD: Date | null;
}

export class User extends Entity<UserProps> {
  get userNome() {
    return this.props.NOM_USER;
  }

  get userPerfil() {
    return this.props.PERFIL_USER;
  }

  get userEmail() {
    return this.props.DSC_EMAIL;
  }

  get userPassword() {
    return this.props.DSC_PASSWORD;
  }

  get userEntraObjectId() {
    return this.props.COD_ENTRA_OBJECT_ID;
  }

  get userAuthProvider() {
    return this.props.DSC_AUTH_PROVIDER;
  }

  get userUltimaAutenticacao() {
    return this.props.DHS_ULTIMA_AUTENTICACAO;
  }

  get userUsuarioCriacao(): string | null {
    return this.props.USUARIO_CRIACAO;
  }

  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  get updatedAt() {
    return this.props.DHS_ULTIMA_ALTERACAO;
  }

  get userEmailVerificationToken() {
    return this.props.DSC_EMAIL_VERIFICATION_TOKEN;
  }

  get userEmailVerificationExpires() {
    return this.props.DSC_EMAIL_VERIFICATION_EXPIRES;
  }

  get userEmailVerified() {
    return this.props.BOL_EMAIL_VERIFIED;
  }

  get userResetPasswordToken() {
    return this.props.DSC_RESET_PASSWORD_TOKEN;
  }

  get userResetPasswordExpires() {
    return this.props.DHS_EXPIRES_RESET_PASSWORD;
  }

  get userDataExclusao() {
    return this.props.DHS_EXCLUSAO;
  }

  private touch() {
    this.props.DHS_ULTIMA_ALTERACAO = new Date();
  }

  SetUserNomeUsuario(userNomeUsuario: string) {
    this.props.NOM_USER = userNomeUsuario;
    this.touch();
  }

  SetUserPerfilUsuario(userPerfilUsuario: string) {
    this.props.PERFIL_USER = userPerfilUsuario;
    this.touch();
  }

  SetUserEmailUsuario(userEmailUsuario: string) {
    this.props.DSC_EMAIL = userEmailUsuario;
    this.touch();
  }

  SetUserPasswordUsuario(userPasswordUsuario: string) {
    this.props.DSC_PASSWORD = userPasswordUsuario;
    this.touch();
  }

  SetUserEntraObjectId(userEntraObjectId: string) {
    this.props.COD_ENTRA_OBJECT_ID = userEntraObjectId;
    this.touch();
  }

  SetUserUltimaAutenticacao(userUltimaAutenticacao: Date) {
    this.props.DHS_ULTIMA_AUTENTICACAO = userUltimaAutenticacao;
    this.touch();
  }

  setUserUsuarioCriacao(userUsuarioCriacao: string) {
    this.props.USUARIO_CRIACAO = userUsuarioCriacao;
    this.touch();
  }

  setUserEmailVerificationToken(userEmailVerificationToken: string) {
    this.props.DSC_EMAIL_VERIFICATION_TOKEN = userEmailVerificationToken;
    this.touch();
  }

  setUserEmailVerificationExpires(userEmailVerificationExpires: Date) {
    this.props.DSC_EMAIL_VERIFICATION_EXPIRES = userEmailVerificationExpires;
    this.touch();
  }

  setUserEmailVerified(userEmailVerified: boolean) {
    this.props.BOL_EMAIL_VERIFIED = userEmailVerified;
    this.touch();
  }

  setUserResetPasswordToken(userResetPasswordToken: string) {
    this.props.DSC_RESET_PASSWORD_TOKEN = userResetPasswordToken;
    this.touch();
  }

  static create(props: UserProps, id?: UniqueEntityID) {
    const user = new User(props, id);

    return user;
  }
}
