import { Pitometria } from '../../enterprise/entities/pitometria';

export abstract class PitometriaRepository {
  abstract findById(id: string): Promise<Pitometria | null>;
  abstract findMany(): Promise<Pitometria[]>;
  abstract create(
    pitometria: Pitometria,
    longitude: number,
    latitude: number,
  ): Promise<void>;
  abstract save(pitometria: Pitometria): Promise<void>;
  abstract saveGeometria(
    id: string,
    longitude: number,
    latitude: number,
    usuarioAtualizacao: string,
  ): Promise<void>;
  abstract delete(id: string, usuarioExclusao: string): Promise<void>;
}
