import {
  Controller,
  Get,
  Query,
  BadRequestException,
  HttpCode,
  Res,
} from '@nestjs/common';
import { Public } from '@/infra/auth/public';
import { VerifyAccountUseCase } from '@/domain/security/application/use-cases/verify-account';
import { Response } from 'express';
import { ConfigService } from '@/config/config.service';

@Controller('verify-account')
export class VerifyAccountController {
  constructor(
    private readonly verifyAccount: VerifyAccountUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Public()
  @HttpCode(302)
  async verifyEmail(
    @Query('token') DSC_EMAIL_VERIFICATION_TOKEN: string,
    @Res() res: Response,
  ) {
    if (!DSC_EMAIL_VERIFICATION_TOKEN) {
      throw new BadRequestException('Token de verificação é obrigatório');
    }

    await this.verifyAccount.execute({
      DSC_EMAIL_VERIFICATION_TOKEN,
    });

    const baseUrl = await this.configService.getConfig('BASE_URL_FRONTEND');

    res.redirect(`${baseUrl?.toString()}/email-verified`);
  }
}
