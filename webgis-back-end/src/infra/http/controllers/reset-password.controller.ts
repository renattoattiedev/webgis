import {
  Controller,
  Post,
  HttpCode,
  UsePipes,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { Public } from '@/infra/auth/public';
import { z } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe';
import { ResetPasswordUseCase } from '@/domain/security/application/use-cases/reset-password';
import { EmailService } from '@/infra/modulos_ext/email/email/email.service';
import { ReCAPTCHAAPI } from '@/infra/modulos_ext/reCAPTCHA/reCAPTCHA-api';

const passwordRegex = new RegExp(
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
);

const resetPasswordBodySchema = z.object({
  token: z.string(),
  DSC_PASSWORD: z.string().min(8).regex(passwordRegex, {
    message:
      'Password must include upper and lower case letters, numbers, and special characters',
  }),
  captchaToken: z.string(),
});

type ResetPasswordBodySchema = z.infer<typeof resetPasswordBodySchema>;

@Controller('reset-password')
@Public()
export class ResetPasswordController {
  constructor(
    private resetPasswordUseCase: ResetPasswordUseCase,
    private emailService: EmailService,
    private recaptchaAPI: ReCAPTCHAAPI,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(resetPasswordBodySchema))
  async handle(@Body() body: ResetPasswordBodySchema) {
    const {
      token: DSC_RESET_PASSWORD_TOKEN,
      DSC_PASSWORD,
      captchaToken,
    } = body;

    const captchaIsValid =
      await this.recaptchaAPI.verifyCaptchaToken(captchaToken);

    if (!captchaIsValid) {
      throw new BadRequestException('Falha na verificação do Captcha.');
    }

    const result = await this.resetPasswordUseCase.execute({
      DSC_RESET_PASSWORD_TOKEN,
      DSC_PASSWORD,
    });

    if (result.isLeft()) {
      const error = result.value;
      throw new BadRequestException(error.message);
    } else {
      await this.emailService.sendInformationResetEmail(result.value.DSC_EMAIL);
    }
  }
}
