import { BadRequestException, Controller, Get, Req } from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { FetchPitometriaUseCase } from '@/domain/pitometria/application/use-cases/fetch-pitometria';
import { PitometriaPresenter } from '../presenters/pitometria-presenter';

@Controller('/pitometria')
export class FetchPitometriaController {
  constructor(
    private fetchPitometriaUseCase: FetchPitometriaUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Get()
  async handle(@Req() request: Request) {
    const userLogin: UserPayload = request['user'];
    const COD_USER_ID = userLogin.sub;

    const perfil = await this.getUserPerfilUseCase.execute({ COD_USER_ID });
    if (!['Editor', 'Admin'].includes(perfil.value?.userPerfil ?? '')) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const result = await this.fetchPitometriaUseCase.execute();
    const pitometrias = result.value.pitometrias;

    return {
      pitometrias: pitometrias.map(PitometriaPresenter.toHTTP),
      total: pitometrias.length,
      totalVazao: pitometrias.filter((p) => p.tipo === 'VAZAO').length,
      totalPressao: pitometrias.filter((p) => p.tipo === 'PRESSAO').length,
    };
  }
}
