import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetCamadasUseCase } from '@/domain/camadas/application/use-cases/get-camada';

@Controller('/get-camada-vetorial-existente/:camadaNome')
export class GetCamadaVetorialExistenteController {
  constructor(private getCamadasUseCase: GetCamadasUseCase) {}

  @Get()
  async handle(@Req() request: Request, @Param('camadaNome') NOM_NOME: string) {
    const user: UserPayload = request['user'];

    if (!user) {
      throw new BadRequestException('Usuário não autenticado!');
    }
    const result = await this.getCamadasUseCase.execute({
      NOM_NOME,
    });

    if (result.isLeft()) {
      return false;
    }

    if (result.isRight()) {
      return true;
    }
  }
}
