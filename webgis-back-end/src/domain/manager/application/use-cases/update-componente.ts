import { Injectable } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { Componente } from '../../enterprise/entities/componente';
import { ComponenteRepository } from '../repositories/componente-repository';

interface UpdateComponenteRequest {
  COD_COMPONENTE_ID: string;
  NOM_NOME_COMPONENTE: string;
  DSC_DESCRICAO?: string | null;
  JSON_CONFIGURACAO: any;
  FLG_HABILITADO: boolean;
}

type UpdateComponenteResponse = Either<
  Error,
  {
    componente: Componente;
  }
>;

@Injectable()
export class UpdateComponenteUseCase {
  constructor(private componenteRepository: ComponenteRepository) {}

  async execute({
    COD_COMPONENTE_ID,
    NOM_NOME_COMPONENTE,
    DSC_DESCRICAO,
    JSON_CONFIGURACAO,
    FLG_HABILITADO,
  }: UpdateComponenteRequest): Promise<UpdateComponenteResponse> {
    const componente =
      await this.componenteRepository.findById(COD_COMPONENTE_ID);
    if (!componente) {
      throw new Error('Componente não encontrado');
    }

    componente.setNome(NOM_NOME_COMPONENTE);
    componente.setDescricao(DSC_DESCRICAO ?? null);
    componente.setConfiguracao(JSON_CONFIGURACAO);
    componente.setHabilitado(FLG_HABILITADO);

    await this.componenteRepository.save(componente);

    return right({
      componente,
    });
  }
}
