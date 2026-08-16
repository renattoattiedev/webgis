import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@/config/config.module';
import { ConfigService } from '@/config/config.service';
import { EmailService } from './email.service';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = await configService.getConfig('MAIL_HOST');
        const port = await configService.getConfig('MAIL_PORT');
        const user = await configService.getConfig('MAIL_USER');
        const pass = await configService.getConfig('MAIL_PASS');
        const from = await configService.getConfig('MAIL_FROM');

        const transportConfig: any = {
          host,
          port,
          secure: false,
          requireTLS: true,
          ignoreTLS: false,
        };

        if (user && pass && user.trim() !== '' && pass.trim() !== '') {
          console.log('Using authentication with provided credentials');
          transportConfig.auth = {
            user,
            pass,
          };
        } else {
          console.log('Skipping authentication - no credentials provided');
          transportConfig.auth = false;
        }

        return {
          transport: transportConfig,
          defaults: {
            from: from || 'noreply@cesan.com.br',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
