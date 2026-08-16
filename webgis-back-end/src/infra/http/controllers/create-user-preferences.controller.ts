import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CreatePreferencesUseCase } from '@/domain/user/application/use-cases/create-preferences';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { UserPreferencesPresenter } from '../presenters/user-preferences-presenter';

interface CreatePreferencesBody {
  selectedLayers?: any;
  zoom?: number | null;
  centerX?: number | null;
  extent?: any;
}

@Controller('/user-preferences')
export class CreateUserPreferencesController {
  constructor(private createPreferences: CreatePreferencesUseCase) {}

  @Post()
  async handle(
    @Body() body: CreatePreferencesBody,
    @CurrentUser() user: UserPayload | null,
  ) {
    try {
      if (!user) {
        throw new HttpException(
          { status: HttpStatus.UNAUTHORIZED, error: 'Usuário não autenticado' },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = await this.createPreferences.execute({
        COD_USER_ID: user.sub,
        SELECTED_LAYERS: body.selectedLayers ?? null,
        ZOOM: body.zoom ?? null,
        CENTER_X: body.centerX ?? null,
        EXTENT: body.extent ?? null,
      });

      if (result.isLeft()) {
        throw new HttpException(
          {
            status: HttpStatus.CONFLICT,
            error: 'Preferências já existentes para este usuário',
          },
          HttpStatus.CONFLICT,
        );
      }

      return {
        preference: UserPreferencesPresenter.toHTTP(result.value.preference),
        success: true,
        message: 'Preferências criadas com sucesso',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Erro ao criar preferências',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
