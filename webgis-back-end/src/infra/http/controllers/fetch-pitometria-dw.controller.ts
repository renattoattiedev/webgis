import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { FetchPitometriaDwUseCase } from '@/domain/pitometria-dw/application/use-cases/fetch-pitometria-dw.use-case';
import { PitometriaDwPresenter } from '../presenters/pitometria-dw-presenter';

@Controller('/pitometria-dw')
export class FetchPitometriaDwController {
  constructor(
    private fetchPitometriaDwUseCase: FetchPitometriaDwUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Get()
  async handle(
    @Req() request: Request,
    @Query('codSimp') codSimp?: string,
    @Query('matricula') matricula?: string,
    @Query('numeroOs') numeroOs?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const userLogin: UserPayload = request['user'];
    const COD_USER_ID = userLogin.sub;

    const perfil = await this.getUserPerfilUseCase.execute({ COD_USER_ID });
    if (
      !['Editor', 'Admin', 'Viewer'].includes(perfil.value?.userPerfil ?? '')
    ) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const filtros = {
      codSimp: codSimp || undefined,
      matricula: matricula || undefined,
      numeroOs: numeroOs || undefined,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
    };

    const temFiltro = Object.values(filtros).some((v) => v !== undefined);
    if (!temFiltro) {
      throw new BadRequestException(
        'Informe ao menos um filtro para realizar a consulta',
      );
    }

    const result = await this.fetchPitometriaDwUseCase.execute(filtros);
    const medicoes = result.value.medicoes;
    const LIMITE = 5000;

    return {
      medicoes: medicoes.map(PitometriaDwPresenter.toHTTP),
      total: medicoes.length,
      truncado: medicoes.length >= LIMITE,
    };
  }
}
