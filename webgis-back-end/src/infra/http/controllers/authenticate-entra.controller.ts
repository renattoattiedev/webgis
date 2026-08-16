import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  UnauthorizedException,
  HttpCode,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { Public } from '@/infra/auth/public';
import {
  EntraOidcService,
  EntraIdTokenClaims,
} from '@/infra/auth/entra-oidc.service';
import { AuthenticateEntraUserUseCase } from '@/domain/security/application/use-cases/authenticate-entra-user';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { RegisterLastLoginUseCase } from '@/domain/security/application/use-cases/register-last-login';

@Controller('/authenticate/entra')
@Public()
export class AuthenticateEntraController {
  constructor(
    private entraOidcService: EntraOidcService,
    private authenticateEntraUser: AuthenticateEntraUserUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private registerLastLoginUseCase: RegisterLastLoginUseCase,
  ) {}

  @Get()
  @HttpCode(302)
  redirect(@Res() res: Response) {
    const authorizationUrl = this.entraOidcService.buildAuthorizationUrl();
    res.redirect(authorizationUrl);
  }

  @Get('/callback')
  async callback(@Query('code') code: string) {
    if (!code) {
      throw new BadRequestException('Código de autorização ausente.');
    }

    try {
      let claims: EntraIdTokenClaims;

      try {
        claims = await this.entraOidcService.exchangeCodeForClaims(code);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('Erro ao trocar code por claims no Entra ID:', message);
        throw new UnauthorizedException('Falha ao autenticar com Microsoft.');
      }

      const result = await this.authenticateEntraUser.execute(claims);

      if (result.isLeft()) {
        throw new BadRequestException(result.value.message);
      }

      const { accessToken, user } = result.value;

      const profileResult = await this.getUserPerfilUseCase.execute({
        COD_USER_ID: user.id.toString(),
      });

      if (profileResult.isLeft()) {
        throw new BadRequestException('Erro ao buscar perfil do usuário.');
      }

      await this.registerLastLoginUseCase.execute({
        COD_USER_ID: user.id.toString(),
      });

      return {
        access_token: accessToken,
        idUsuario: user.id.toString(),
        nomeUsuario: user.userNome,
        perfil: profileResult.value.userPerfil,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro no callback do Entra ID:', message);
      throw new BadRequestException('Falha ao concluir o login com Microsoft.');
    }
  }
}
