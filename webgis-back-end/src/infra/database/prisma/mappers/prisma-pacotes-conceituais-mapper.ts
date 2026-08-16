import {
  Prisma,
  PacotesConceituais as PrismaPacotesConceituais,
} from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PacotesConceituais } from '@/domain/manager/enterprise/entities/pacotes-conceituais';

export class PrismaPacotesConceituaisMapper {
  static toDomain(raw: PrismaPacotesConceituais): PacotesConceituais {
    return PacotesConceituais.create(
      {
        NOM_NOME_PACOTE_CONCEITUAL: raw.NOM_NOME_PACOTE_CONCEITUAL,
        DSC_TITULO: raw.DSC_TITULO,
        DSC_HOST: raw.DSC_HOST,
        DSC_PORT: raw.DSC_PORT,
        DSC_DATABASE: raw.DSC_DATABASE,
        DSC_SCHEMA: raw.DSC_SCHEMA,
        DSC_USER: raw.DSC_USER,
        DSC_PASSWORD: raw.DSC_PASSWORD,
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO.toString(),
        DHS_ULTIMA_ALTERACAO: raw.DHS_ULTIMA_ALTERACAO,
        USUARIO_ULTIMA_ALTERACAO: raw.COD_USUARIO_ULTIMA_ALTERACAO,
      },
      new UniqueEntityID(raw.COD_PACOTE_CONCEITUAL_ID.toString()),
    );
  }

  static toPrisma(
    pacoteConceitual: PacotesConceituais,
  ): Prisma.PacotesConceituaisUncheckedCreateInput {
    return {
      COD_PACOTE_CONCEITUAL_ID: pacoteConceitual.id.toString(),
      DSC_TITULO: pacoteConceitual.pacoteConceitualTitulo,
      NOM_NOME_PACOTE_CONCEITUAL: pacoteConceitual.pacoteConceitualNome,
      DSC_HOST: pacoteConceitual.pacoteConceitualHost,
      DSC_PORT: pacoteConceitual.pacoteConceitualPort,
      DSC_DATABASE: pacoteConceitual.pacoteConceitualDatabase,
      DSC_SCHEMA: pacoteConceitual.pacoteConceitualSchema,
      DSC_USER: pacoteConceitual.pacoteConceitualUser,
      DSC_PASSWORD: pacoteConceitual.pacoteConceitualPassword,
      COD_USUARIO_CRIACAO: pacoteConceitual.pacoteConceitualUsuarioCriacao,
      COD_USUARIO_ULTIMA_ALTERACAO:
        pacoteConceitual.pacoteConceitualUsuarioAlteracao,
    };
  }
}
