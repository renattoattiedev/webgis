import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@/config/config.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    try {
      const baseUrl = await this.configService.getConfig('BASE_URL');
      const verificationLink = `${baseUrl}/verify-account?token=${token}`;

      const logoPath = path.resolve(
        process.cwd(),
        'assets/images/logo-cesan.png',
      );
      let logoUrl;

      if (fs.existsSync(logoPath)) {
        logoUrl = 'cid:logo';
      } else {
        console.warn('Logo não encontrado em:', logoPath);
        logoUrl = '';
      }

      const emailHtmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${
            logoUrl
              ? `<div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="Logo Cesan" style="max-width: 150px;" />
          </div>`
              : ''
          }
          <h2>Confirme seu endereço de e-mail</h2>
          <p>Obrigado por se cadastrar em nosso sistema. Para confirmar seu endereço de e-mail, por favor clique no link abaixo:</p>
          <p><a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Confirmar e-mail</a></p>
          <p>Se você não solicitou esta verificação, por favor ignore este e-mail.</p>
          <p>Atenciosamente,<br>Equipe Cesan</p>
        </div>
      `;

      const mailOptions = {
        to,
        subject: 'Confirmação de E-mail',
        html: emailHtmlContent,
      };

      if (fs.existsSync(logoPath)) {
        mailOptions['attachments'] = [
          {
            filename: 'logo-cesan.png',
            path: logoPath,
            cid: 'logo',
          },
        ];
      }

      await this.mailerService.sendMail(mailOptions);
      console.log(`Email de verificação enviado para: ${to}`);
    } catch (error) {
      console.error('Erro ao enviar email de verificação:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const baseUrl = await this.configService.getConfig('BASE_URL_FRONTEND');
    const resetPasswordLink = `${baseUrl}/reset-password/${token}`;

    const emailHtmlContent = `
    <div style="text-align: center;">
      <img src="cid:cesanLogo" style="width: 150px; margin-bottom: 20px;"/>
      <h1>Redefina sua senha</h1>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta. Por favor, clique no botão abaixo para definir uma nova senha:</p>
      <a href="${resetPasswordLink}" style="display: inline-block; background-color: #004A99; color: #ffffff; padding: 10px 20px; margin: 20px 0; border-radius: 5px; text-decoration: none;">Redefinir Senha</a>
      <p>Caso não tenha solicitado esta redefinição, ignore este e-mail ou entre em contato conosco para mais informações.</p>
    </div>
    `;

    await this.mailerService.sendMail({
      to,
      subject: 'Redefina sua senha',
      html: emailHtmlContent,
      attachments: [
        {
          filename: 'logo.png',
          path: 'logo-cesan.png',
          cid: 'cesanLogo',
        },
      ],
    });
  }

  async sendInformationResetEmail(to: string): Promise<void> {
    const emailHtmlContent = `
    <div style="text-align: center;">
      <img src="cid:cesanLogo" style="width: 150px; margin-bottom: 20px;"/>
      <h1>Sua Senha foi Redefinida</h1>
      <p>Caso não tenha solicitado esta alteração de senha, por favor, ignore este e-mail ou tente redefinir sua senha novamente através do nosso sistema. É importante garantir que sua conta esteja segura.</p>
      <p>Se você enfrentar quaisquer problemas ou não solicitou uma redefinição de senha, entre em contato conosco imediatamente.</p>
    </div>
    `;
    await this.mailerService.sendMail({
      to,
      subject: 'Sua Senha foi redefinida',
      html: emailHtmlContent,
      attachments: [
        {
          filename: 'logo.png',
          path: 'logo-cesan.png',
          cid: 'cesanLogo',
        },
      ],
    });
  }
}
