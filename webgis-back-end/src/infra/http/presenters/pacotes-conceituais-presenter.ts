import { PacotesConceituais } from '@/domain/manager/enterprise/entities/pacotes-conceituais';

export class PacotesConceituaisPresenter {
  static toHTTP(pacote: PacotesConceituais) {
    return {
      id: pacote.id.toString(),
      nome: pacote.pacoteConceitualNome,
      nomePacoteConceitual: pacote.pacoteConceitualNome,
      titulo: pacote.pacoteConceitualTitulo,
      tituloPacoteConceitual: pacote.pacoteConceitualTitulo,
      host: pacote.pacoteConceitualHost,
      port: pacote.pacoteConceitualPort,
      database: pacote.pacoteConceitualDatabase,
      schema: pacote.pacoteConceitualSchema,
      user: pacote.pacoteConceitualUser,
      password: pacote.pacoteConceitualPassword,
      criadoEm: pacote.createdAt,
      usuarioCriacao: pacote.pacoteConceitualUsuarioCriacao,
      updatedAt: pacote.updatedAt,
      usuarioAlteracao: pacote.pacoteConceitualUsuarioAlteracao,
    };
  }

  // 🆕 Versão com segurança
  static toHTTPWithSecurity(pacote: PacotesConceituais, isAdmin: boolean) {
    const base = this.toHTTP(pacote);

    if (isAdmin) {
      // Admin vê dados mascarados
      return {
        ...base,
        connectionData: pacote.getConnectionDataMasked(),
        canEdit: true,
        hasSensitiveData: true,
      };
    } else {
      // Usuário comum não vê dados de conexão
      return {
        id: base.id,
        nome: base.nome,
        titulo: base.titulo,
        criadoEm: base.criadoEm,
        usuarioCriacao: base.usuarioCriacao,
        connectionData: {
          host: '[ACESSO NEGADO]',
          port: '[ACESSO NEGADO]',
          database: '[ACESSO NEGADO]',
          schema: '[ACESSO NEGADO]',
          user: '[ACESSO NEGADO]',
          password: '[ACESSO NEGADO]',
        },
        canEdit: false,
        hasSensitiveData: true,
        accessDenied: true,
      };
    }
  }
}
