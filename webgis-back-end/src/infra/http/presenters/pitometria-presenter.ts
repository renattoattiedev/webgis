import { Pitometria } from '@/domain/pitometria/enterprise/entities/pitometria';

export class PitometriaPresenter {
  static toHTTP(pitometria: Pitometria) {
    return {
      id: pitometria.id.toString(),
      codigoSimp: pitometria.codigoSimp,
      matricula: pitometria.matricula,
      tipo: pitometria.tipo,
      longitude: pitometria.longitude,
      latitude: pitometria.latitude,
      criadoEm: pitometria.criadoEm,
      atualizadoEm: pitometria.atualizadoEm,
    };
  }
}
