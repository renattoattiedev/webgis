import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { FetchRelatorioUsoUseCase } from '@/domain/relatorios/application/use-cases/fetch-relatorio-uso';

@Controller('/relatorios/uso')
export class FetchRelatorioUsoController {
  constructor(
    private fetchRelatorioUso: FetchRelatorioUsoUseCase,
    private getUserPerfil: GetUserPerfilUseCase,
  ) {}

  @Get()
  async handle(
    @Req() request: Request,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
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

    const hoje = new Date();
    const trinta = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

    const inicio = dataInicio ? new Date(dataInicio + 'T00:00:00') : trinta;
    const fim = dataFim ? new Date(dataFim + 'T23:59:59') : hoje;

    return this.fetchRelatorioUso.execute({ dataInicio: inicio, dataFim: fim });
  }
}
