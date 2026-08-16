import { Injectable } from '@nestjs/common';
import { Issuer, Client, TokenSet } from 'openid-client';
import { EnvService } from '../env/env.service';

export interface EntraIdTokenClaims {
  entraObjectId: string;
  email: string;
  name: string;
}

@Injectable()
export class EntraOidcService {
  private client: Client | null = null;

  constructor(private envService: EnvService) {}

  private authority(): string {
    return `https://login.microsoftonline.com/${this.envService.get(
      'ENTRA_TENANT_ID',
    )}/v2.0`;
  }

  buildAuthorizationUrl(): string {
    const tenantId = this.envService.get('ENTRA_TENANT_ID');
    const clientId = this.envService.get('ENTRA_CLIENT_ID');
    const redirectUri = this.envService.get('ENTRA_REDIRECT_URI');

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile email',
      response_mode: 'query',
    });

    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  private async getClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    const issuer = await Issuer.discover(this.authority());

    this.client = new issuer.Client({
      client_id: this.envService.get('ENTRA_CLIENT_ID'),
      client_secret: this.envService.get('ENTRA_CLIENT_SECRET'),
      redirect_uris: [this.envService.get('ENTRA_REDIRECT_URI')],
      response_types: ['code'],
    });

    return this.client;
  }

  async exchangeCodeForClaims(code: string): Promise<EntraIdTokenClaims> {
    const client = await this.getClient();
    const redirectUri = this.envService.get('ENTRA_REDIRECT_URI');

    const tokenSet: TokenSet = await client.callback(
      redirectUri,
      { code },
      { response_type: 'code' },
    );

    const claims = tokenSet.claims();

    if (!claims.sub || !claims.email) {
      throw new Error(
        'Token do Entra ID não contém claims obrigatórias (sub/email).',
      );
    }

    return {
      entraObjectId: claims.oid?.toString() ?? claims.sub,
      email: claims.email.toString(),
      name: claims.name?.toString() ?? claims.email.toString(),
    };
  }
}
