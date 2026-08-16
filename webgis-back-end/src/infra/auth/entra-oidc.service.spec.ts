import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntraOidcService } from './entra-oidc.service';
import { EnvService } from '../env/env.service';

function makeEnvService(): EnvService {
  const values: Record<string, string> = {
    ENTRA_TENANT_ID: 'tenant-123',
    ENTRA_CLIENT_ID: 'client-123',
    ENTRA_CLIENT_SECRET: 'secret-123',
    ENTRA_REDIRECT_URI: 'http://localhost:3333/authenticate/entra/callback',
  };
  return { get: (key: string) => values[key] } as unknown as EnvService;
}

describe('EntraOidcService', () => {
  let sut: EntraOidcService;

  beforeEach(() => {
    sut = new EntraOidcService(makeEnvService());
  });

  it('monta a URL de autorização com os parâmetros corretos', () => {
    const url = sut.buildAuthorizationUrl();

    expect(url).toContain(
      'https://login.microsoftonline.com/tenant-123/oauth2/v2.0/authorize',
    );
    expect(url).toContain('client_id=client-123');
    expect(url).toContain('response_type=code');
    expect(url).toContain('scope=openid+profile+email');
    expect(url).toContain(
      'redirect_uri=' +
        encodeURIComponent('http://localhost:3333/authenticate/entra/callback'),
    );
  });
});
