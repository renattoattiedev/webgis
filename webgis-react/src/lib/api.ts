// GEO Portal — Camada de API (conecta ao backend NestJS)
// usa o proxy do Vite: /api -> http://localhost:3333 (ver vite.config.ts)

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export interface AuthResponse {
  access_token: string;
  idUsuario: string;
  nomeUsuario: string;
  perfil: { DSC_PERFIL: string } | null;
}

type AutenticarParams = {
  DSC_EMAIL: string;
  DSC_PASSWORD: string;
  isFromPlugin?: boolean;
  secretToken?: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function autenticar(params: AutenticarParams): Promise<AuthResponse> {
  // Para desenvolvimento local, usa o fluxo de plugin (secret token da config
  // TP_CONFIG) evitando o reCAPTCHA. Em produção, enviar captchaToken.
  const secretToken = import.meta.env.VITE_PLUGIN_SECRET;
  const resp = await request<AuthResponse>('/authenticate', {
    method: 'POST',
    body: JSON.stringify({
      DSC_EMAIL: params.DSC_EMAIL,
      DSC_PASSWORD: params.DSC_PASSWORD,
      isFromPlugin: true,
      secretToken,
    }),
  });
  if (resp.access_token) {
    localStorage.setItem('access_token', resp.access_token);
    localStorage.setItem('nome_usuario', resp.nomeUsuario);
  }
  return resp;
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('nome_usuario');
}

export class ApiError extends Error {}

export const api = {
  autenticar,
  get: (path: string) => request(path),
  post: (path: string, body: unknown) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),
};