import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { z } from 'zod';
import { AuthenticateUserUseCase } from '@/domain/security/application/use-cases/authenticate-user';
import { WrongCredentialsError } from '@/domain/security/application/use-cases/errors/wrong-credentials-error';
import { Public } from '@/infra/auth/public';
import { GetUserEmailUseCase } from '@/domain/security/application/use-cases/get-user-email';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { ReCAPTCHAAPI } from '@/infra/modulos_ext/reCAPTCHA/reCAPTCHA-api';
import { RegisterLastLoginUseCase } from '@/domain/security/application/use-cases/register-last-login';
import { ConfigService } from '@/config/config.service';

const authenticateBodySchema = z.object({
  DSC_EMAIL: z.string().email(),
  DSC_PASSWORD: z.string(),
  captchaToken: z.string().optional(),
  isFromPlugin: z.boolean().optional(),
  secretToken: z.string().optional(),
});

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>;

@Controller('/authenticate')
@Public()
export class AuthenticateController {
  constructor(
    private authenticateUser: AuthenticateUserUseCase,
    private getUserEmail: GetUserEmailUseCase,
    private getPerfilUseCase: GetUserPerfilUseCase,
    private registerLastLoginUseCase: RegisterLastLoginUseCase,
    private recaptchaAPI: ReCAPTCHAAPI,
    private configService: ConfigService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {
    const { DSC_EMAIL, DSC_PASSWORD, captchaToken, isFromPlugin, secretToken } =
      body;

    if (isFromPlugin && secretToken) {
      if (!this.validatePluginSecret(secretToken)) {
        throw new UnauthorizedException('Autenticação de plugin falhou.');
      }
    } else {
      if (
        !captchaToken ||
        !(await this.recaptchaAPI.verifyCaptchaToken(captchaToken))
      ) {
        throw new BadRequestException('Falha na verificação do Captcha.');
      }
    }

    const result = await this.authenticateUser.execute({
      DSC_EMAIL,
      DSC_PASSWORD,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new UnauthorizedException('Credenciais inválidas');
        default:
          throw new BadRequestException('Erro ao autenticar o usuário');
      }
    }

    const user = await this.getUserEmail.execute({ DSC_EMAIL });

    if (!user.value?.user.userEmailVerified) {
      throw new UnauthorizedException('E-mail não verificado.');
    }

    const profileResult = await this.getPerfilUseCase.execute({
      COD_USER_ID: user.value.user.id.toString(),
    });

    if (profileResult.isLeft()) {
      throw new BadRequestException('Erro ao buscar perfil do usuário');
    }

    const { accessToken } = result.value;

    this.registerLastLoginUseCase.execute({
      COD_USER_ID: user.value.user.id.toString(),
    });

    return {
      access_token: accessToken,
      idUsuario: user.value.user.id.toString(),
      nomeUsuario: user.value.user.userNome,
      perfil: profileResult.value.userPerfil,
    };
  }

  private async validatePluginSecret(secretToken: string): Promise<boolean> {
    return (
      secretToken === (await this.configService.getConfig('PLUGIN_SECRET'))
    );
  }
}
