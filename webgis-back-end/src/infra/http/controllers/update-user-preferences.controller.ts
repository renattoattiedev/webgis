import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { UpdatePreferencesUseCase } from '@/domain/user/application/use-cases/update-preferences';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { UserPreferencesPresenter } from '../presenters/user-preferences-presenter';
import { GetPreferencesUseCase } from '@/domain/user/application/use-cases/get-preferences';

interface UpdatePreferencesBody {
  selectedLayers?: any;
  zoom?: number | null;
  centerX?: number | null;
  extent?: any;
}

@Controller('/user-preferences')
export class UpdateUserPreferencesController {
  constructor(
    private updatePreferences: UpdatePreferencesUseCase,
    private getPreferences: GetPreferencesUseCase,
  ) {}

  @Put()
  async handle(
    @Body() body: UpdatePreferencesBody,
    @CurrentUser() user: UserPayload | null,
  ) {
    try {
      if (!user) {
        throw new HttpException(
          { status: HttpStatus.UNAUTHORIZED, error: 'Usuário não autenticado' },
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.updatePreferences.execute({
        COD_USER_ID: user.sub,
        SELECTED_LAYERS: body.selectedLayers,
        ZOOM: body.zoom,
        CENTER_X: body.centerX,
        EXTENT: body.extent,
      });

      // Retorna objeto atualizado
      const result = await this.getPreferences.execute({
        COD_USER_ID: user.sub,
      });
      if (result.isLeft()) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Preferências não encontradas após atualização',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        preference: UserPreferencesPresenter.toHTTP(result.value.preference),
        success: true,
        message: 'Preferências atualizadas com sucesso',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Erro ao atualizar preferências',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
