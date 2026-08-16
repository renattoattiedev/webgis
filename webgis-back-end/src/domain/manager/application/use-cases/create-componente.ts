import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Componente } from '../../enterprise/entities/componente';
import { ComponenteRepository } from '../repositories/componente-repository';

interface CreateComponenteRequest {
  NOM_NOME_COMPONENTE: string;
  DSC_DESCRICAO?: string | null;
  JSON_CONFIGURACAO: any;
  FLG_HABILITADO: boolean;
}

type CreateComponenteResponse = Either<
  Error,
  {
    componente: Componente;
  }
>;

@Injectable()
export class CreateComponenteUseCase {
  constructor(private componenteRepository: ComponenteRepository) {}

  async execute({
    NOM_NOME_COMPONENTE,
    DSC_DESCRICAO,
    JSON_CONFIGURACAO,
    FLG_HABILITADO,
  }: CreateComponenteRequest): Promise<CreateComponenteResponse> {
    const componenteWithSameNome =
      await this.componenteRepository.findByNome(NOM_NOME_COMPONENTE);

    if (componenteWithSameNome) {
      return left(new Error('Componente já existe com esse nome'));
    }

    const componente = Componente.create({
      NOM_NOME_COMPONENTE,
      DSC_DESCRICAO,
      JSON_CONFIGURACAO,
      FLG_HABILITADO,
    });

    await this.componenteRepository.create(componente);

    return right({
      componente,
    });
  }
}
