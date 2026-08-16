import {
  Controller,
  Post,
  HttpCode,
  UsePipes,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Public } from '@/infra/auth/public';
import { z } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe';
import { EmailService } from '@/infra/modulos_ext/email/email/email.service';
import { UserRepository } from '@/domain/security/application/repositories/user-repository';
import { SavePasswordResetUseCase } from '@/domain/security/application/use-cases/save-password-reset-user';
import { v4 as uuidv4 } from 'uuid';
import { ReCAPTCHAAPI } from '@/infra/modulos_ext/reCAPTCHA/reCAPTCHA-api';

const recoveryPasswordBodySchema = z.object({
  DSC_EMAIL: z.string(),
  captchaToken: z.string(),
});

type RecoveryPassowrdBodySchema = z.infer<typeof recoveryPasswordBodySchema>;
@Controller('recovery-password')
@Public()
export class RecoveryPassowrdController {
  constructor(
    private emailService: EmailService,
    private userRepository: UserRepository,
    private savePasswordResetUseCase: SavePasswordResetUseCase,
    private recaptchaAPI: ReCAPTCHAAPI,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(recoveryPasswordBodySchema))
  async handle(@Body() body: RecoveryPassowrdBodySchema) {
    const { DSC_EMAIL, captchaToken } = body;

    const captchaIsValid =
      await this.recaptchaAPI.verifyCaptchaToken(captchaToken);

    if (!captchaIsValid) {
      throw new BadRequestException('Falha na verificação do Captcha.');
    }

    const user = await this.userRepository.findByEmail(DSC_EMAIL);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const resetToken = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await this.savePasswordResetUseCase.execute({
      COD_USER_ID: user.id.toString(),
      DSC_RESET_PASSWORD_TOKEN: resetToken,
      DHS_EXPIRES_RESET_PASSWORD: expires,
    });

    await this.emailService.sendPasswordResetEmail(DSC_EMAIL, resetToken);
  }
}
