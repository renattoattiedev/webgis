import { User as PrismaUser, Prisma } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { User } from '@/domain/security/enterprise/entities/user';

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create(
      {
        NOM_USER: raw.NOM_USER,
        PERFIL_USER: raw.COD_PERFIL_USER,
        DSC_EMAIL: raw.DSC_EMAIL,
        DSC_PASSWORD: raw.DSC_PASSWORD,
        COD_ENTRA_OBJECT_ID: raw.COD_ENTRA_OBJECT_ID,
        DSC_AUTH_PROVIDER: raw.DSC_AUTH_PROVIDER,
        DHS_ULTIMA_AUTENTICACAO: raw.DHS_ULTIMA_AUTENTICACAO,
        USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO,
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        DHS_EXCLUSAO: raw.DHS_EXCLUSAO,
        DSC_EMAIL_VERIFICATION_EXPIRES: raw.DSC_EMAIL_VERIFICATION_EXPIRES,
        DSC_EMAIL_VERIFICATION_TOKEN: raw.DSC_EMAIL_VERIFICATION_TOKEN,
        BOL_EMAIL_VERIFIED: raw.BOL_EMAIL_VERIFIED,
        DSC_RESET_PASSWORD_TOKEN: raw.DSC_RESET_PASSWORD_TOKEN,
        DHS_EXPIRES_RESET_PASSWORD: raw.DHS_EXPIRES_RESET_PASSWORD,
      },
      new UniqueEntityID(raw.COD_USER_ID),
    );
  }

  static toPrisma(user: User): Prisma.UserUncheckedCreateInput {
    return {
      COD_USER_ID: user.id.toString(),
      NOM_USER: user.userNome,
      COD_PERFIL_USER: user.userPerfil,
      DSC_EMAIL: user.userEmail,
      DSC_PASSWORD: user.userPassword,
      COD_ENTRA_OBJECT_ID: user.userEntraObjectId,
      DSC_AUTH_PROVIDER: user.userAuthProvider,
      DHS_ULTIMA_AUTENTICACAO: user.userUltimaAutenticacao,
      COD_USUARIO_CRIACAO: user.userUsuarioCriacao,
      DSC_EMAIL_VERIFICATION_TOKEN: user.userEmailVerificationToken,
      BOL_EMAIL_VERIFIED: user.userEmailVerified,
      DSC_EMAIL_VERIFICATION_EXPIRES: user.userEmailVerificationExpires,
      DSC_RESET_PASSWORD_TOKEN: user.userResetPasswordToken,
      DHS_EXPIRES_RESET_PASSWORD: user.userResetPasswordExpires,
    };
  }
}
