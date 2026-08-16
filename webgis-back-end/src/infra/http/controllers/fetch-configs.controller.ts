import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Request,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';

import { FetchConfigsUseCase } from '@/domain/manager/application/use-cases/fetch-configs';
import { ConfigPresenter } from '../presenters/config-presenter';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { Public } from '@/infra/auth/public';
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard';

@Controller('/fetch-configs')
export class FetchConfigController {
  constructor(
    private fetchConfigs: FetchConfigsUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Get()
  @Public()
  async handle(@Request() req) {
    try {
      const result = await this.fetchConfigs.execute();
      if (result.isLeft()) throw new BadRequestException();

      const configs = result.value.config;
      let isAdmin = false;

      // Verificar se é admin
      if (req.user?.sub) {
        try {
          const userPerfil = await this.getUserPerfilUseCase.execute({
            COD_USER_ID: req.user.sub,
          });
          isAdmin =
            userPerfil.isRight() && userPerfil.value.userPerfil === 'Admin';
        } catch (error) {
          isAdmin = false;
        }
      }

      // Processar configs para exibição
      const processedConfigs = configs.map((config) => {
        const configHttp = ConfigPresenter.toHTTP(config);

        if (config.isSensitive) {
          return {
            ...configHttp,
            value: isAdmin
              ? this.maskSensitiveValue(config.configValue || '')
              : null,
            canEdit: isAdmin, // 🆕 Indica se pode editar
            displayValue: isAdmin
              ? `[PROTEGIDO] ***${(config.configValue || '').slice(-2)}`
              : '[ACESSO NEGADO]',
          };
        }

        return {
          ...configHttp,
          canEdit: true, // Configs públicas todos podem editar
          displayValue: config.configValue,
        };
      });

      return { configs: processedConfigs };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Erro ao buscar configurações.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Novo endpoint para buscar valor real para edição
  @Get('/edit/:id')
  @UseGuards(JwtAuthGuard)
  async getForEdit(@Param('id') id: string, @Request() req) {
    try {
      // Verificar se é admin
      const userPerfil = await this.getUserPerfilUseCase.execute({
        COD_USER_ID: req.user.sub,
      });

      if (userPerfil.isLeft() || userPerfil.value.userPerfil !== 'Admin') {
        throw new ForbiddenException(
          'Apenas administradores podem editar configurações sensíveis',
        );
      }

      const result = await this.fetchConfigs.execute();
      if (result.isLeft()) throw new BadRequestException();

      const config = result.value.config.find((c) => c.id.toString() === id);
      if (!config) throw new NotFoundException('Configuração não encontrada');

      // Log de auditoria
      console.log(
        `🔐 Admin ${req.user.sub} acessou config ${config.configKey} para edição`,
      );

      // Retornar valor real apenas para configs que o admin pode editar
      if (config.isSensitive) {
        return {
          id: config.id.toString(),
          key: config.configKey,
          value: config.configValue, // ⚠️ Valor real apenas para edição
          isSensitive: true,
          warning: 'Valor sensível - manter sigilo',
        };
      }

      return ConfigPresenter.toHTTP(config);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Erro ao buscar configuração para edição.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private maskSensitiveValue(value: string): string {
    if (!value || value.length <= 4) {
      return '*'.repeat(value?.length || 8);
    }
    return (
      value.substring(0, 2) +
      '*'.repeat(value.length - 4) +
      value.substring(value.length - 2)
    );
  }
}
