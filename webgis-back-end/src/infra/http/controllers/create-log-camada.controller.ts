import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { Public } from '@/infra/auth/public';
import { ReCAPTCHAAPI } from '@/infra/modulos_ext/reCAPTCHA/reCAPTCHA-api';
import { RegisterLogCamadaUseCase } from '@/domain/camadas/application/use-cases/register-log-camada';

const createCamadaLogBodySchema = z.object({
  id: z.string(),
  captchaToken: z.string(),
});

type CreateCamadaLogBodySchema = z.infer<typeof createCamadaLogBodySchema>;

@Controller('/create-log-camada')
@Public()
export class CreateLogCamadaController {
  constructor(
    private registerLogCamadaUseCase: RegisterLogCamadaUseCase,
    private recaptchaAPI: ReCAPTCHAAPI,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createCamadaLogBodySchema))
  async handle(@Body() body: CreateCamadaLogBodySchema) {
    const { id: COD_CAMADA_ID, captchaToken } = body;

    const captchaIsValid =
      await this.recaptchaAPI.verifyCaptchaToken(captchaToken);

    if (!captchaIsValid) {
      throw new BadRequestException('Falha na verificação do Captcha.');
    }

    const result = await this.registerLogCamadaUseCase.execute({
      COD_CAMADA_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }
  }
}
