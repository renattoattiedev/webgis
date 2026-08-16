import { Injectable } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { Temas } from '../../enterprise/entities/temas';
import { TemasRepository } from '../repositories/temas-repository';

interface UpdateTemaRequest {
  COD_TEMA_ID: string;
  NOM_NOME_TEMA: string;
  USUARIO_ULTIMA_ALTERACAO: string;
}

type UpdateTemaResponse = Either<
  Error,
  {
    tema: Temas;
  }
>;

@Injectable()
export class UpdateTemaUseCase {
  constructor(private temasRepository: TemasRepository) {}

  async execute({
    COD_TEMA_ID,
    NOM_NOME_TEMA,
    USUARIO_ULTIMA_ALTERACAO,
  }: UpdateTemaRequest): Promise<UpdateTemaResponse> {
    const tema = await this.temasRepository.findById(COD_TEMA_ID.toString());
    if (!tema) {
      throw new Error('Tema not found');
    }

    tema.setTemaNome(NOM_NOME_TEMA);

    if (USUARIO_ULTIMA_ALTERACAO) {
      tema.setTemasUsuarioAltercao(USUARIO_ULTIMA_ALTERACAO);
    }
    await this.temasRepository.save(tema);

    return right({
      tema,
    });
  }
}
