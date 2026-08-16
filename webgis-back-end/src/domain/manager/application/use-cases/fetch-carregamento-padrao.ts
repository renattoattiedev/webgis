import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import {
  ContentRepository,
  UnifiedContentRow,
} from '../repositories/content-repository';

type FetchCarregamentoPadraoUseCaseResponse = Either<
  null,
  {
    conteudo: UnifiedContentRow[];
  }
>;

@Injectable()
export class FetchCarregamentoPadraoUseCase {
  constructor(private contentRepository: ContentRepository) {}

  async executeMany(): Promise<FetchCarregamentoPadraoUseCaseResponse> {
    const rows = await this.contentRepository.fetchCarregamentoPadrao();
    return right({ conteudo: rows });
  }
}
