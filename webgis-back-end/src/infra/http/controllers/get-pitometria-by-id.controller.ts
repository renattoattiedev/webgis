import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { GetPitometriaByIdUseCase } from '@/domain/pitometria/application/use-cases/get-pitometria-by-id';
import { PitometriaPresenter } from '../presenters/pitometria-presenter';

@Controller('/pitometria/:id')
export class GetPitometriaByIdController {
  constructor(
    private getPitometriaByIdUseCase: GetPitometriaByIdUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Get()
  async handle(@Req() request: Request, @Param('id') id: string) {
    const userLogin: UserPayload = request['user'];
    const COD_USER_ID = userLogin.sub;

    const perfil = await this.getUserPerfilUseCase.execute({ COD_USER_ID });
    if (!['Editor', 'Admin'].includes(perfil.value?.userPerfil ?? '')) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const result = await this.getPitometriaByIdUseCase.execute({ id });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    return { pitometria: PitometriaPresenter.toHTTP(result.value.pitometria) };
  }
}
