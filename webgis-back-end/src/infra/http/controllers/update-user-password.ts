import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Put,
  Req,
  UnauthorizedException,
  InternalServerErrorException,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { UpdatePasswordUserUseCase } from '@/domain/security/application/use-cases/update-password-user';
import { GetUserUseCase } from '@/domain/security/application/use-cases/get-user';
import { AuthenticateUserUseCase } from '@/domain/security/application/use-cases/authenticate-user';
import { WrongCredentialsError } from '@/domain/security/application/use-cases/errors/wrong-credentials-error';

const updatePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, 'A senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(8, 'A nova senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'A nova senha deve conter pelo menos uma letra maiúscula')
      .regex(/[a-z]/, 'A nova senha deve conter pelo menos uma letra minúscula')
      .regex(/\d/, 'A nova senha deve conter pelo menos um número')
      .regex(
        /[@$!%*?&]/,
        'A nova senha deve conter pelo menos um caractere especial (@$!%*?&)',
      ),
  })
  .superRefine((data, ctx) => {
    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A nova senha deve ser diferente da senha atual',
        path: ['newPassword'],
      });
    }
  });

type UpdatePasswordBodySchema = z.infer<typeof updatePasswordBodySchema>;

@Controller('/update-user-password')
export class UpdateUserPasswordController {
  constructor(
    private updatePasswordUserUseCase: UpdatePasswordUserUseCase,
    private getUserUseCase: GetUserUseCase,
    private authenticateUser: AuthenticateUserUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updatePasswordBodySchema))
  async handle(
    @Req() request: Request,
    @Body() body: UpdatePasswordBodySchema,
  ) {
    try {
      const user: UserPayload = request['user'];
      if (!user || !user.sub) {
        throw new UnauthorizedException('Token JWT inválido');
      }

      const userId = user.sub;

      const userResult = await this.getUserUseCase.execute({
        COD_USER_ID: userId,
      });

      if (userResult.isLeft()) {
        throw new BadRequestException('Usuário não encontrado');
      }

      const currentUser = userResult.value?.user;
      if (!currentUser) {
        throw new BadRequestException('Dados do usuário não encontrados');
      }

      const userEmail = currentUser.userEmail;
      if (!userEmail) {
        throw new BadRequestException('Email do usuário não encontrado');
      }

      const { currentPassword, newPassword } = body;

      const authResult = await this.authenticateUser.execute({
        DSC_EMAIL: userEmail,
        DSC_PASSWORD: currentPassword,
      });

      if (authResult.isLeft()) {
        const error = authResult.value;

        switch (error.constructor) {
          case WrongCredentialsError:
            throw new UnauthorizedException('Senha atual incorreta');
          default:
            throw new BadRequestException('Erro ao verificar a senha atual');
        }
      }

      await this.updatePasswordUserUseCase.execute({
        COD_USER_ID: userId,
        DSC_PASSWORD: newPassword,
      });

      return {
        message: 'Senha atualizada com sucesso',
        success: true,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('Erro inesperado ao atualizar senha:', error);

      throw new InternalServerErrorException(
        'Ocorreu um erro interno ao processar sua solicitação. Por favor, tente novamente.',
      );
    }
  }
}
