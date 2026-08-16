import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { z } from 'zod';
import { EditCamadaUseCase } from '@/domain/camadas/application/use-cases/edit-camada';

const editCamadaBodySchema = z.object({
  NOM_NOME: z.string(),
  DSC_TITULO: z.string(),
  DSC_DESCRICAO: z.string(),
  DSC_LINK_METADADOS: z.string(),
  TXT_TERMOS_DE_USO: z.string(),
  NIVEL_COMPATILHAMENTO: z.string(),
  GRUPOS_CAMADAS: z.string(),
  TXT_TAGS: z.string(),
  PACOTES_CONCEITUAIS: z.string(),
  DSC_FONTE_DADOS_CAMADA: z.string(),
});

const bodyValidationPipe = new ZodValidationPipe(editCamadaBodySchema);

type EditCamadaBodySchema = z.infer<typeof editCamadaBodySchema>;

@Controller('/edit-camadas/:codCamada')
export class EditCamadasController {
  constructor(private editCamada: EditCamadaUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @Body(bodyValidationPipe) body: EditCamadaBodySchema,
    @CurrentUser() user: UserPayload,
    @Param('codCamada') COD_CAMADA_ID: string,
  ) {
    const {
      NOM_NOME,
      DSC_TITULO,
      DSC_DESCRICAO,
      DSC_LINK_METADADOS,
      TXT_TERMOS_DE_USO,
      NIVEL_COMPATILHAMENTO,
      GRUPOS_CAMADAS,
      TXT_TAGS,
      PACOTES_CONCEITUAIS,
      DSC_FONTE_DADOS_CAMADA,
    } = body;

    const result = await this.editCamada.execute({
      COD_CAMADA_ID,
      NOM_NOME,
      DSC_TITULO,
      DSC_DESCRICAO,
      DSC_LINK_METADADOS,
      TXT_TERMOS_DE_USO,
      NIVEL_COMPATILHAMENTO,
      GRUPOS_CAMADAS,
      TXT_TAGS,
      PACOTES_CONCEITUAIS,
      DSC_FONTE_DADOS_CAMADA,
      DHS_ALTERACAO: new Date(),
      COD_USUARIO_ULTIMA_ALTERACAO: user.sub,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }
  }
}
