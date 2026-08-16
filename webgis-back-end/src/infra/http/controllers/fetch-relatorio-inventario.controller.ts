import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { FetchRelatorioInventarioUseCase } from '@/domain/relatorios/application/use-cases/fetch-relatorio-inventario';

@Controller('/relatorios/inventario')
export class FetchRelatorioInventarioController {
  constructor(
    private fetchRelatorioInventario: FetchRelatorioInventarioUseCase,
    private getUserPerfil: GetUserPerfilUseCase,
  ) {}

  @Get()
  async handle(
    @Req() request: Request,
    @Query('temaId') temaId?: string,
    @Query('ativo') ativo?: string,
  ) {
    const userLogin: UserPayload = request['user'];
    const perfil = await this.getUserPerfil.execute({
      COD_USER_ID: userLogin.sub,
    });
    if (!['Admin', 'Editor'].includes(perfil.value?.userPerfil ?? '')) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const ativoFilter =
      ativo === 'true' ? true : ativo === 'false' ? false : undefined;

    return this.fetchRelatorioInventario.execute({
      temaId: temaId || undefined,
      ativo: ativoFilter,
    });
  }
}
