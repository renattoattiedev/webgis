import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Req,
  UsePipes,
  Put,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { UpdateCamadaUseCase } from '@/domain/camadas/application/use-cases/update-camada';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

const updateCamadaBodySchema = z.object({
  id: z.string(),
  nomeCamada: z.string(),
  tituloCamada: z.string(),
  descricaoCamada: z.string(),
  linkMetadados: z.string(),
  termosDeUso: z.string(),
  nivelCompartilhamentoId: z.string(),
  grupoCamada: z.string(),
  tags: z.string(),
  fonteDadosCamada: z.string(),
  boundingBox: z.object({
    minx: z.number(),
    maxx: z.number(),
    miny: z.number(),
    maxy: z.number(),
    crs: z.object({
      '@class': z.string(),
      $: z.string(),
    }),
  }),
  carregamentoDefault: z.boolean().optional(),
});
const bodyValidationPipe = new ZodValidationPipe(updateCamadaBodySchema);

type UpdateCamadaBodySchema = z.infer<typeof updateCamadaBodySchema>;

@Controller('/update-camada')
export class UpdateCamadaController {
  constructor(
    private updateCamadaUseCase: UpdateCamadaUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updateCamadaBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: UpdateCamadaBodySchema,
  ) {
    const user: UserPayload = request['user'];

    const id = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: id,
    });

    if (
      perfil.value?.userPerfil !== 'Admin' &&
      perfil.value?.userPerfil !== 'Publicador'
    ) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const {
      id: COD_CAMADA_ID,
      nomeCamada: NOM_NOME,
      tituloCamada: DSC_TITULO,
      descricaoCamada: DSC_DESCRICAO,
      linkMetadados: DSC_LINK_METADADOS,
      termosDeUso: TXT_TERMOS_DE_USO,
      nivelCompartilhamentoId: NIVEL_COMPATILHAMENTO,
      grupoCamada: GRUPOS_CAMADAS,
      tags: TXT_TAGS,
      fonteDadosCamada: DSC_FONTE_DADOS_CAMADA,
      boundingBox,
      carregamentoDefault: BOL_CARREGAMENTO_DEFAULT,
    } = body;

    try {
      await this.updateCamadaUseCase.execute({
        COD_CAMADA_ID,
        NOM_NOME,
        DSC_TITULO,
        DSC_DESCRICAO,
        DSC_LINK_METADADOS,
        TXT_TERMOS_DE_USO,
        NIVEL_COMPATILHAMENTO,
        GRUPOS_CAMADAS,
        TXT_TAGS,
        DSC_FONTE_DADOS_CAMADA,
        DSC_BOUNDING_BOX: JSON.stringify(boundingBox),
        COD_USUARIO_ULTIMA_ALTERACAO: id.toString(),
        BOL_CARREGAMENTO_DEFAULT,
        COD_USER_SOLICITANTE: id,
        DSC_PERFIL_SOLICITANTE: perfil.value?.userPerfil ?? null,
      });
    } catch (error) {
      if (error instanceof NotAllowedError) {
        throw new ForbiddenException(
          'Sem permissão para alterar este conteúdo',
        );
      }
      throw new BadRequestException(error);
    }
  }
}
