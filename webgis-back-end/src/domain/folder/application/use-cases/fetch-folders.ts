import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FoldersRepository } from '../../../folder/application/repositories/foders-repository';
import { Folders } from '../../../folder/enterprise/entities/folders';

interface FetchFoldersUseCaseRequest {
  COD_USUARIO_CRIACAO: string;
}

type FetchFoldersUseCaseResponse = Either<
  null,
  {
    folder: Folders[];
  }
>;

@Injectable()
export class FetchFoldersUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    COD_USUARIO_CRIACAO,
  }: FetchFoldersUseCaseRequest): Promise<FetchFoldersUseCaseResponse> {
    const folder =
      await this.foldersRepository.findByUserId(COD_USUARIO_CRIACAO);

    return right({
      folder,
    });
  }
}
