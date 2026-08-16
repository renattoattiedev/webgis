import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { FetchPitometriaDwSpatialUseCase } from '@/domain/pitometria-dw/application/use-cases/fetch-pitometria-dw-spatial.use-case';
import { PitometriaDwPresenter } from '../presenters/pitometria-dw-presenter';

interface SpatialQueryBody {
  polygon: object;
  dataInicio?: string;
  dataFim?: string;
  medicaoPressao?: boolean;
  medicaoVazao?: boolean;
  fontesDados?: string[];
  incluirOcorrencia?: boolean;
}

@Controller('/pitometria-dw/spatial')
export class FetchPitometriaDwSpatialController {
  constructor(
    private fetchPitometriaDwSpatialUseCase: FetchPitometriaDwSpatialUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Post()
  async handle(@Req() request: Request, @Body() body: SpatialQueryBody) {
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

    if (!body.polygon) {
      throw new BadRequestException('Campo "polygon" é obrigatório');
    }

    let polygonGeoJSON: string;
    try {
      polygonGeoJSON = JSON.stringify(body.polygon);
    } catch {
      throw new BadRequestException(
        'Campo "polygon" deve ser um GeoJSON válido',
      );
    }

    const result = await this.fetchPitometriaDwSpatialUseCase.execute({
      polygonGeoJSON,
      dataInicio: body.dataInicio
        ? new Date(body.dataInicio + 'T00:00:00')
        : undefined,
      dataFim: body.dataFim ? new Date(body.dataFim + 'T23:59:59') : undefined,
      medicaoPressao: body.medicaoPressao,
      medicaoVazao: body.medicaoVazao,
      fontesDados: body.fontesDados,
      incluirOcorrencia: body.incluirOcorrencia,
    });

    const medicoes = result.value.medicoes;
    const LIMITE = 5000;

    return {
      medicoes: medicoes.map(PitometriaDwPresenter.toHTTP),
      total: medicoes.length,
      truncado: medicoes.length >= LIMITE,
    };
  }
}
