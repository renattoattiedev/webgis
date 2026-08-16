import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { User } from '../../enterprise/entities/user';
import { UserRepository } from '../../../security/application/repositories/user-repository';
import { HashGenerator } from '../cryptography/hash-generator';
import { UserAlreadyExistsError } from './errors/user-already-exists-error';

interface RegisterUserUseCaseRequest {
  NOM_USER: string;
  PERFIL_USER: string;
  DSC_EMAIL: string;
  DSC_PASSWORD: string;
  DHS_INCLUSAO: Date;
  USUARIO_CRIACAO: string | null;
  DSC_EMAIL_VERIFICATION_TOKEN: string | null;
  DSC_EMAIL_VERIFICATION_EXPIRES: Date | null;
  BOL_EMAIL_VERIFIED: boolean | false;
}

type RegisterUserUseCaseResponse = Either<
  UserAlreadyExistsError,
  {
    user: User;
  }
>;

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    NOM_USER,
    PERFIL_USER,
    DSC_EMAIL,
    DSC_PASSWORD,
    DHS_INCLUSAO,
    USUARIO_CRIACAO,
    BOL_EMAIL_VERIFIED,
    DSC_EMAIL_VERIFICATION_TOKEN,
    DSC_EMAIL_VERIFICATION_EXPIRES,
  }: RegisterUserUseCaseRequest): Promise<RegisterUserUseCaseResponse> {
    const userWithSameEmail = await this.userRepository.findByEmail(DSC_EMAIL);

    if (userWithSameEmail) {
      return left(new UserAlreadyExistsError(DSC_EMAIL));
    }

    const hashedPassword = await this.hashGenerator.hash(DSC_PASSWORD);

    const user = User.create({
      NOM_USER,
      PERFIL_USER,
      DSC_EMAIL,
      DSC_PASSWORD: hashedPassword,
      COD_ENTRA_OBJECT_ID: null,
      DSC_AUTH_PROVIDER: 'local',
      DHS_ULTIMA_AUTENTICACAO: null,
      DHS_INCLUSAO,
      DHS_EXCLUSAO: null,
      USUARIO_CRIACAO,
      BOL_EMAIL_VERIFIED,
      DSC_EMAIL_VERIFICATION_TOKEN,
      DSC_EMAIL_VERIFICATION_EXPIRES,
      DSC_RESET_PASSWORD_TOKEN: null,
      DHS_EXPIRES_RESET_PASSWORD: null,
    });

    await this.userRepository.create(user);

    return right({
      user,
    });
  }
}
