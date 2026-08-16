import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';

import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';
import { PacotesConceituaisPresenter } from '../presenters/pacotes-conceituais-presenter';
import { Public } from '@/infra/auth/public';
import { GetUserUseCase } from '@/domain/security/application/use-cases/get-user';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { GeoserverAPI } from '@/infra/modulos_ext/geoserver/geoserver-api';
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard';

@Controller('/fetch-pacotes-conceituais')
export class FetchPacotesConceituaisController {
  constructor(
    private fethPacotesConceituais: FetchPacotesConceituaisUseCase,
    private getUsuario: GetUserUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private geoserverAPI: GeoserverAPI,
  ) {}

  @Get()
  @Public()
  async handle(
    @Param('pacoteConceitualId') COD_PACOTE_CONCEITUAL_ID: string,
    @Request() req,
  ) {
    const result = await this.fethPacotesConceituais.executeMany({
      COD_PACOTE_CONCEITUAL_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    const pacotesConceituais = result.value.pacotesConceituaisMany;

    // Verificar se é admin
    let isAdmin = false;
    if (req.user?.sub) {
      try {
        const userPerfil = await this.getUserPerfilUseCase.execute({
          COD_USER_ID: req.user.sub,
        });

        if (userPerfil.isRight() && userPerfil.value.userPerfil === 'Admin') {
          isAdmin = true;
          console.log(`🔒 Admin acessou pacotes conceituais: ${req.user.sub}`);
        }
      } catch (error) {
        isAdmin = false;
      }
    }

    const enrichPacote = await Promise.all(
      pacotesConceituais.map((pacoteConceitual) =>
        this.enrichPacote(pacoteConceitual, isAdmin),
      ),
    );

    return { pacotesConceituais: enrichPacote };
  }

  // 🆕 Endpoint para obter dados de conexão REAIS para uso pelo sistema
  @Get('/connection-data/:id')
  @UseGuards(JwtAuthGuard)
  async getConnectionData(@Param('id') id: string, @Request() req) {
    try {
      // Verificar se é admin
      const userPerfil = await this.getUserPerfilUseCase.execute({
        COD_USER_ID: req.user.sub,
      });

      if (userPerfil.isLeft() || userPerfil.value.userPerfil !== 'Admin') {
        throw new ForbiddenException(
          'Apenas administradores podem acessar dados de conexão',
        );
      }

      const result = await this.fethPacotesConceituais.executeMany({
        COD_PACOTE_CONCEITUAL_ID: id,
      });

      if (result.isLeft()) throw new BadRequestException();

      const pacote = result.value.pacotesConceituaisMany.find(
        (p) => p.id.toString() === id,
      );
      if (!pacote)
        throw new BadRequestException('Pacote conceitual não encontrado');

      // 🔒 Log de auditoria crítico
      console.log(
        `🚨 ACESSO CREDENCIAIS: Admin ${
          req.user.sub
        } acessou dados reais do pacote ${
          pacote.pacoteConceitualNome
        } em ${new Date()}`,
      );

      // Retornar dados REAIS para uso pelo sistema
      return {
        id: pacote.id.toString(),
        nome: pacote.pacoteConceitualNome,
        connectionData: {
          host: pacote.pacoteConceitualHost,
          port: pacote.pacoteConceitualPort,
          database: pacote.pacoteConceitualDatabase,
          schema: pacote.pacoteConceitualSchema,
          user: pacote.pacoteConceitualUser,
          password: pacote.pacoteConceitualPassword,
        },
        warning: '⚠️ DADOS SENSÍVEIS - Uso exclusivo para operações do sistema',
        accessTime: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error(`❌ Erro ao acessar dados de conexão:`, error);
      throw new BadRequestException(error.message);
    }
  }

  // 🆕 NOVO: Endpoint para buscar pacote para edição (apenas admins)
  @Get('/edit/:id')
  @UseGuards(JwtAuthGuard)
  async getPacoteForEdit(@Param('id') id: string, @Request() req) {
    try {
      // 🔒 Verificar se é admin
      const userPerfil = await this.getUserPerfilUseCase.execute({
        COD_USER_ID: req.user.sub,
      });

      if (userPerfil.isLeft() || userPerfil.value.userPerfil !== 'Admin') {
        console.warn(
          `🚫 Tentativa de acesso negado para edição: usuário ${req.user.sub}`,
        );
        throw new ForbiddenException(
          'Apenas administradores podem editar pacotes conceituais',
        );
      }

      // 🔍 Buscar pacote específico
      const result = await this.fethPacotesConceituais.executeMany({
        COD_PACOTE_CONCEITUAL_ID: id,
      });

      if (result.isLeft()) {
        throw new BadRequestException('Erro ao buscar pacote conceitual');
      }

      const pacote = result.value.pacotesConceituaisMany.find(
        (p) => p.id.toString() === id,
      );

      if (!pacote) {
        throw new BadRequestException('Pacote conceitual não encontrado');
      }

      // 🔒 Log de auditoria para edição
      console.log(
        `🔐 EDIÇÃO: Admin ${req.user.sub} acessou pacote ${
          pacote.pacoteConceitualNome
        } para edição em ${new Date()}`,
      );

      // 🆕 Retornar dados COMPLETOS para edição
      return {
        id: pacote.id.toString(),
        nome: pacote.pacoteConceitualNome,
        titulo: pacote.pacoteConceitualTitulo,
        connectionData: {
          host: pacote.pacoteConceitualHost,
          port: pacote.pacoteConceitualPort,
          database: pacote.pacoteConceitualDatabase,
          schema: pacote.pacoteConceitualSchema,
          user: pacote.pacoteConceitualUser,
          password: pacote.pacoteConceitualPassword,
        },
        hasSensitiveData: true,
        warning:
          '⚠️ ATENÇÃO: Você está editando dados sensíveis de conexão. Mantenha absoluto sigilo sobre essas informações!',
        metadata: {
          criadoEm: pacote.createdAt,
          usuarioCriacao: pacote.pacoteConceitualUsuarioCriacao,
          updatedAt: pacote.updatedAt,
          usuarioUltimaAlteracao: pacote.pacoteConceitualUsuarioAlteracao,
          validadoGeoserver: await this.checkGeoserverValidation(
            pacote.pacoteConceitualNome,
          ),
        },
        accessInfo: {
          accessTime: new Date().toISOString(),
          adminUser: req.user.sub,
          operation: 'EDIT_ACCESS',
        },
      };
    } catch (error: any) {
      console.error(`❌ Erro ao buscar pacote para edição:`, error);

      // Se for erro de permissão, manter o ForbiddenException
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new BadRequestException(
        error.message || 'Erro interno do servidor',
      );
    }
  }

  // 🆕 Método auxiliar para verificar validação no GeoServer
  private async checkGeoserverValidation(pacoteNome: string): Promise<boolean> {
    try {
      const connectionParams = await this.geoserverAPI.getDataStore(pacoteNome);
      return !!connectionParams?.entry;
    } catch (error) {
      console.warn(
        `⚠ Erro ao verificar GeoServer para ${pacoteNome}:`,
        error instanceof Error ? error.message : 'Erro desconhecido',
      );
      return false;
    }
  }

  private async enrichPacote(
    pacoteConceitual: any,
    isAdmin: boolean,
  ): Promise<any> {
    const usrCriacao = await this.getUser(
      pacoteConceitual.pacoteConceitualUsuarioCriacao,
    );

    const usrAlteracao = await this.getUser(
      pacoteConceitual.pacoteConceitualUsuarioAlteracao,
    );

    // Base com diferentes níveis de acesso
    const base = {
      ...PacotesConceituaisPresenter.toHTTP(pacoteConceitual),
      nomeUsrCriacao: usrCriacao,
      nomeUsrAlteracao: usrAlteracao,
      host: isAdmin
        ? this.maskValue(pacoteConceitual.pacoteConceitualHost)
        : '[ACESSO NEGADO]',
      database: isAdmin
        ? this.maskValue(pacoteConceitual.pacoteConceitualDatabase)
        : '[ACESSO NEGADO]',
      port: isAdmin ? pacoteConceitual.pacoteConceitualPort : '[ACESSO NEGADO]',
      schema: isAdmin
        ? pacoteConceitual.pacoteConceitualSchema
        : '[ACESSO NEGADO]',
      user: isAdmin
        ? this.maskValue(pacoteConceitual.pacoteConceitualUser)
        : '[ACESSO NEGADO]',
      password: isAdmin ? '********' : '[ACESSO NEGADO]',
      canEdit: isAdmin,
      hasSensitiveData: true,
      canAccessConnectionData: isAdmin,
      validadoGeoserver: false,
    };

    // Se não é admin, retornar base sem tentar validar GeoServer
    if (!isAdmin) {
      return {
        ...base,
        accessDenied: true,
      };
    }

    try {
      const connectionParams = await this.geoserverAPI.getDataStore(
        pacoteConceitual.pacoteConceitualNome,
      );

      if (connectionParams?.entry) {
        const host =
          connectionParams.entry.find((p) => p['@key'] === 'host')?.$ ?? null;
        const database =
          connectionParams.entry.find((p) => p['@key'] === 'database')?.$ ??
          null;
        const port =
          connectionParams.entry.find((p) => p['@key'] === 'port')?.$ ?? null;
        const schema =
          connectionParams.entry.find((p) => p['@key'] === 'schema')?.$ ?? null;
        const user =
          connectionParams.entry.find((p) => p['@key'] === 'user')?.$ ?? null;

        console.log(
          `✓ GeoServer: Pacote ${pacoteConceitual.pacoteConceitualNome} validado com sucesso`,
        );

        return {
          ...base,
          host: this.maskValue(host || ''),
          database: this.maskValue(database || ''),
          port,
          schema,
          user: this.maskValue(user || ''),
          validadoGeoserver: true,
        };
      }

      console.warn(
        `⚠ GeoServer: Pacote ${pacoteConceitual.pacoteConceitualNome} sem parâmetros de conexão`,
      );
      return base;
    } catch (error) {
      console.warn(
        `⚠ GeoServer: Falha na validação do pacote ${pacoteConceitual.pacoteConceitualNome}:`,
        error instanceof Error ? error.message : 'Erro desconhecido',
      );
      return base;
    }
  }

  // Método para mascarar valores
  private maskValue(value: string): string {
    if (!value || value.length <= 4) return '*'.repeat(value?.length || 4);
    return (
      value.substring(0, 2) +
      '*'.repeat(value.length - 4) +
      value.substring(value.length - 2)
    );
  }

  private async getUser(codUser: string): Promise<string> {
    const result = await this.getUsuario.execute({ COD_USER_ID: codUser });
    return result?.value?.user.userNome ?? '';
  }
}
