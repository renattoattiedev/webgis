import { Injectable } from '@nestjs/common';
import { ConfigService } from '@/config/config.service';
import axios from 'axios';

@Injectable()
export class ReCAPTCHAAPI {
  constructor(private configService: ConfigService) {}

  async verifyCaptchaToken(captchaToken: string): Promise<boolean> {
    const secretKey = await this.configService.getConfig(
      'RECAPTCHA_SECRET_KEY',
    );
    try {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify`,
        null,
        {
          params: {
            secret: secretKey,
            response: captchaToken,
          },
        },
      );
      return response.data.success && response.data.score >= 0.5;
    } catch (error) {
      console.error('Erro na verificação do reCAPTCHA', error);
      return false;
    }
  }
}
