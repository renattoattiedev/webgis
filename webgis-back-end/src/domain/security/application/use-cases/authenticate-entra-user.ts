import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../security/application/repositories/user-repository';
import { PerfilRepository } from '../../../security/application/repositories/perfil-repository';
import { Encrypter } from '../cryptography/encrypter';
import { User } from '../../enterprise/entities/user';
import { DefaultProfileNotFoundError } from './errors/default-profile-not-found-error';

const PERFIL_PADRAO_SSO = 'Visualizador';

interface AuthenticateEntraUserUseCaseRequest {
  entraObjectId: string;
  email: string;
  name: string;
}

type AuthenticateEntraUserUseCaseResponse = Either<
  DefaultProfileNotFoundError,
  {
    accessToken: string;
    user: User;
  }
>;

@Injectable()
export class AuthenticateEntraUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private perfilRepository: PerfilRepository,
    private encrypter: Encrypter,
  ) {}

  async execute({
    entraObjectId,
    email,
    name,
  }: AuthenticateEntraUserUseCaseRequest): Promise<AuthenticateEntraUserUseCaseResponse> {
    let user = await this.userRepository.findByEntraObjectId(entraObjectId);

    if (!user) {
      user = await this.userRepository.findByEmail(email);

      if (user) {
        await this.userRepository.linkEntraAccount(
          user.id.toString(),
          entraObjectId,
        );
        user.SetUserEntraObjectId(entraObjectId);
      } else {
        const defaultPerfil =
          await this.perfilRepository.findByPerfil(PERFIL_PADRAO_SSO);

        if (!defaultPerfil) {
          return left(new DefaultProfileNotFoundError(PERFIL_PADRAO_SSO));
        }

        user = User.create({
          NOM_USER: name,
          PERFIL_USER: defaultPerfil.id.toString(),
          DSC_EMAIL: email,
          DSC_PASSWORD: null,
          COD_ENTRA_OBJECT_ID: entraObjectId,
          DSC_AUTH_PROVIDER: 'entra',
          DHS_ULTIMA_AUTENTICACAO: null,
          DHS_INCLUSAO: new Date(),
          DHS_EXCLUSAO: null,
          USUARIO_CRIACAO: null,
          BOL_EMAIL_VERIFIED: true,
          DSC_EMAIL_VERIFICATION_TOKEN: null,
          DSC_EMAIL_VERIFICATION_EXPIRES: null,
          DSC_RESET_PASSWORD_TOKEN: null,
          DHS_EXPIRES_RESET_PASSWORD: null,
        });

        await this.userRepository.create(user);
      }
    }

    const accessToken = await this.encrypter.encrypt({
      sub: user.id.toString(),
    });

    return right({
      accessToken,
      user,
    });
  }
}
