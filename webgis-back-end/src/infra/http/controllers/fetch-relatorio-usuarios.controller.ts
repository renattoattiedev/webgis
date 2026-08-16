import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { FetchRelatorioUsuariosUseCase } from '@/domain/relatorios/application/use-cases/fetch-relatorio-usuarios';

@Controller('/relatorios/usuarios')
export class FetchRelatorioUsuariosController {
  constructor(
    private fetchRelatorioUsuarios: FetchRelatorioUsuariosUseCase,
    private getUserPerfil: GetUserPerfilUseCase,
  ) {}

  @Get()
  async handle(
    @Req() request: Request,
    @Query('perfil') perfil?: string,
    @Query('diasInativo') diasInativo?: string,
  ) {
    const userLogin: UserPayload = request['user'];
    const perfilReq = await this.getUserPerfil.execute({
      COD_USER_ID: userLogin.sub,
    });
    if (!['Admin', 'Editor'].includes(perfilReq.value?.userPerfil ?? '')) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    return this.fetchRelatorioUsuarios.execute({
      perfil: perfil || undefined,
      diasInativo: diasInativo ? parseInt(diasInativo, 10) : undefined,
    });
  }
}
