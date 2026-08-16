import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { RegisterUserUseCase } from '@/domain/security/application/use-cases/register-user';
import { UserAlreadyExistsError } from '@/domain/security/application/use-cases/errors/user-already-exists-error';
import { Public } from '@/infra/auth/public';
import { GetPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil';
import { EmailService } from '@/infra/modulos_ext/email/email/email.service';
import { v4 as uuidv4 } from 'uuid';
import { ReCAPTCHAAPI } from '@/infra/modulos_ext/reCAPTCHA/reCAPTCHA-api';

const passwordRegex = new RegExp(
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
);

const createAccountBodySchema = z.object({
  NOM_USER: z.string(),
  DSC_EMAIL: z.string().email(),
  DSC_PASSWORD: z.string().min(8).regex(passwordRegex, {
    message:
      'Password must include upper and lower case letters, numbers, and special characters',
  }),
  captchaToken: z.string(),
});

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>;

@Controller('/create-account')
@Public()
export class CreateAccountController {
  constructor(
    private registerUser: RegisterUserUseCase,
    private perfil: GetPerfilUseCase,
    private emailService: EmailService,
    private recaptchaAPI: ReCAPTCHAAPI,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(@Body() body: CreateAccountBodySchema) {
    const { NOM_USER, DSC_EMAIL, DSC_PASSWORD, captchaToken } = body;

    const captchaIsValid =
      await this.recaptchaAPI.verifyCaptchaToken(captchaToken);

    if (!captchaIsValid) {
      throw new BadRequestException('Falha na verificação do Captcha.');
    }

    const perfilDescricao = await this.perfil.execute({
      DSC_PERFIL: 'Visualizador',
    });

    const verificationToken = uuidv4();

    const result = await this.registerUser.execute({
      NOM_USER,
      PERFIL_USER: perfilDescricao.value?.perfil.id.toString() ?? '',
      DSC_EMAIL,
      DSC_PASSWORD,
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: null,
      DSC_EMAIL_VERIFICATION_TOKEN: verificationToken,
      DSC_EMAIL_VERIFICATION_EXPIRES: null,
      BOL_EMAIL_VERIFIED: false,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case UserAlreadyExistsError:
          throw new ConflictException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    } else {
      await this.emailService.sendVerificationEmail(
        DSC_EMAIL,
        verificationToken,
      );
    }
  }
}
