import { NivelCompartilhamento } from '../../enterprise/entities/nivel-compartilhamento';

export abstract class NivelCompartilhamentoRepository {
  abstract findById(
    COD_NIVEL_COMPATILHAMENTO: string,
  ): Promise<NivelCompartilhamento | null>;
  abstract findByDSC(
    DSC_NIVEL_COMPATILHAMENTO: string,
  ): Promise<NivelCompartilhamento | null>;
  abstract findManyByNivelCompartilhamentoId(
    COD_NIVEL_COMPATILHAMENTO: string,
  ): Promise<NivelCompartilhamento[]>;
  abstract create(nivelCompartilhamento: NivelCompartilhamento): Promise<void>;
}
