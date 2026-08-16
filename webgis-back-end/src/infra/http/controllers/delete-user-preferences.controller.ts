import { Controller, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { DeletePreferencesUseCase } from '@/domain/user/application/use-cases/delete-preferences';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';

@Controller('/user-preferences')
export class DeleteUserPreferencesController {
  constructor(private deletePreferences: DeletePreferencesUseCase) {}

  @Delete()
  async handle(@CurrentUser() user: UserPayload | null) {
    try {
      if (!user) {
        throw new HttpException(
          { status: HttpStatus.UNAUTHORIZED, error: 'Usuário não autenticado' },
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.deletePreferences.execute({ COD_USER_ID: user.sub });
      return { success: true, message: 'Preferências removidas com sucesso' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Erro ao remover preferências',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
