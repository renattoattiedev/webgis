import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { GetPreferencesUseCase } from '@/domain/user/application/use-cases/get-preferences';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { UserPreferencesPresenter } from '../presenters/user-preferences-presenter';

@Controller('/user-preferences')
export class GetUserPreferencesController {
  constructor(private getPreferences: GetPreferencesUseCase) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload | null) {
    try {
      if (!user) {
        throw new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            error: 'Usuário não autenticado',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = await this.getPreferences.execute({
        COD_USER_ID: user.sub,
      });

      if (result.isLeft()) {
        return {
          preference: null,
          success: true,
          message: 'Nenhuma preferência cadastrada',
        };
      }

      return {
        preference: UserPreferencesPresenter.toHTTP(result.value.preference),
        success: true,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Erro ao obter preferências do usuário',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
