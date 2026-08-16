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
import { RegisterLogMapaUseCase } from '@/domain/mapas/application/use-cases/register-log-mapa';

const createMapaLogBodySchema = z.object({
  id: z.string(),
  captchaToken: z.string(),
});

type CreateMapaLogBodySchema = z.infer<typeof createMapaLogBodySchema>;

@Controller('/create-log-mapa')
@Public()
export class CreateLogMapaController {
  constructor(
    private registerLogMapaUseCase: RegisterLogMapaUseCase,
    private recaptchaAPI: ReCAPTCHAAPI,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createMapaLogBodySchema))
  async handle(@Body() body: CreateMapaLogBodySchema) {
    const { id: COD_MAPA_ID, captchaToken } = body;

    const captchaIsValid =
      await this.recaptchaAPI.verifyCaptchaToken(captchaToken);

    if (!captchaIsValid) {
      throw new BadRequestException('Falha na verificação do Captcha.');
    }

    const result = await this.registerLogMapaUseCase.execute({
      COD_MAPA_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }
  }
}
