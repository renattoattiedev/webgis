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
import { RegisterLogCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/register-log-camada-raster';

const createCamadaRasterLogBodySchema = z.object({
  id: z.string(),
  captchaToken: z.string(),
});

type CreateCamadaRasterLogBodySchema = z.infer<
  typeof createCamadaRasterLogBodySchema
>;

@Controller('/create-log-camada-raster')
@Public()
export class CreateLogCamadaRasterController {
  constructor(
    private registerLogCamadaRasterUseCase: RegisterLogCamadaRasterUseCase,
    private recaptchaAPI: ReCAPTCHAAPI,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createCamadaRasterLogBodySchema))
  async handle(@Body() body: CreateCamadaRasterLogBodySchema) {
    const { id: COD_CAMADA_RASTER_ID, captchaToken } = body;

    const captchaIsValid =
      await this.recaptchaAPI.verifyCaptchaToken(captchaToken);

    if (!captchaIsValid) {
      throw new BadRequestException('Falha na verificação do Captcha.');
    }

    const result = await this.registerLogCamadaRasterUseCase.execute({
      COD_CAMADA_RASTER_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }
  }
}
