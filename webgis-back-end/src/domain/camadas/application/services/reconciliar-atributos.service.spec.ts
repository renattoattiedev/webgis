import { describe, it, expect, beforeEach } from 'vitest';
import { ReconciliarAtributosService } from './reconciliar-atributos.service';
import { InMemoryAtributosRepository } from '../../../../../test/repositories/in-memory-atributos-repository';
import { Atributos } from '../../enterprise/entities/atributos';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

function makeAtributo(
  id: string,
  overrides: Partial<Parameters<typeof Atributos.create>[0]> = {},
) {
  return Atributos.create(
    {
      COD_CAMADA_ID: 'camada-1',
      NOM_NOME_ATRIBUTO: id,
      DSC_LABEL_ATRIBUTO: '',
      DSC_TIPO: 'text',
      NUM_TAMANHO: 0,
      FLG_VISIVEL: true,
      TXT_DESCRICAO: '',
      COD_USUARIO_CRIACAO: 'user-antigo',
      DHS_INCLUSAO: new Date(),
      ...overrides,
    },
    new UniqueEntityID(`attr-${id}`),
  );
}

describe('ReconciliarAtributosService', () => {
  let atributosRepo: InMemoryAtributosRepository;
  let sut: ReconciliarAtributosService;

  beforeEach(() => {
    atributosRepo = new InMemoryAtributosRepository();
    sut = new ReconciliarAtributosService(atributosRepo);
  });

  it('preserva label, visibilidade, descricao e ordem de coluna que permaneceu', async () => {
    atributosRepo.itens.push(
      makeAtributo('codigo', {
        DSC_LABEL_ATRIBUTO: 'Código do ponto',
        FLG_VISIVEL: false,
        TXT_DESCRICAO: 'descrição curada',
        NUM_ORDEM_RENDERIZACAO: 3,
        DSC_TIPO: 'integer',
      }),
    );

    await sut.execute({
      COD_CAMADA_ID: 'camada-1',
      colunas: [
        {
          column_name: 'codigo',
          data_type: 'bigint',
          character_maximum_length: null,
        },
      ],
      COD_USUARIO: 'user-1',
    });

    const atributo = atributosRepo.itens.find(
      (a) => a.atributoNome === 'codigo',
    )!;
    expect(atributo.atributoLabel).toBe('Código do ponto');
    expect(atributo.atributoVisivel).toBe(false);
    expect(atributo.atributoDescricao).toBe('descrição curada');
    expect(atributo.atributoOrdemRenderizacao).toBe(3);
    expect(atributo.atributoTipo).toBe('bigint');
  });

  it('cria coluna nova com os padroes', async () => {
    await sut.execute({
      COD_CAMADA_ID: 'camada-1',
      colunas: [
        {
          column_name: 'vazao_media',
          data_type: 'numeric',
          character_maximum_length: null,
        },
      ],
      COD_USUARIO: 'user-1',
    });

    const atributo = atributosRepo.itens.find(
      (a) => a.atributoNome === 'vazao_media',
    )!;
    expect(atributo).toBeDefined();
    expect(atributo.atributoVisivel).toBe(true);
    expect(atributo.atributoLabel).toBe('');
    expect(atributo.atributoUsuarioCriacao).toBe('user-1');
  });

  it('soft-deleta coluna que sumiu do banco', async () => {
    atributosRepo.itens.push(makeAtributo('obs_antiga'));

    await sut.execute({
      COD_CAMADA_ID: 'camada-1',
      colunas: [
        {
          column_name: 'codigo',
          data_type: 'integer',
          character_maximum_length: null,
        },
      ],
      COD_USUARIO: 'user-1',
    });

    const atributo = atributosRepo.itens.find(
      (a) => a.atributoNome === 'obs_antiga',
    )!;
    expect(atributo.atributoExcluido).toBe(true);
    expect(atributo.atributoUsuarioExclusao).toBe('user-1');
  });

  it('reativa coluna que voltou a existir, preservando a curadoria', async () => {
    const antigo = makeAtributo('temp', {
      DSC_LABEL_ATRIBUTO: 'Temperatura',
      NUM_ORDEM_RENDERIZACAO: 7,
    });
    antigo.excluir('user-antigo');
    atributosRepo.itens.push(antigo);

    const resumo = await sut.execute({
      COD_CAMADA_ID: 'camada-1',
      colunas: [
        {
          column_name: 'temp',
          data_type: 'numeric',
          character_maximum_length: null,
        },
      ],
      COD_USUARIO: 'user-1',
    });

    const reativados = atributosRepo.itens.filter(
      (a) => a.atributoNome === 'temp',
    );
    expect(reativados).toHaveLength(1);
    expect(reativados[0].atributoExcluido).toBe(false);
    expect(reativados[0].atributoLabel).toBe('Temperatura');
    expect(reativados[0].atributoOrdemRenderizacao).toBe(7);

    expect(resumo.atributosAdicionados).toEqual(['temp']);
    expect(
      resumo.atributosAlterados.find((a) => a.nome === 'temp'),
    ).toBeUndefined();
  });

  it('devolve o resumo das mudancas', async () => {
    atributosRepo.itens.push(makeAtributo('codigo', { DSC_TIPO: 'integer' }));
    atributosRepo.itens.push(makeAtributo('obs_antiga'));

    const resumo = await sut.execute({
      COD_CAMADA_ID: 'camada-1',
      colunas: [
        {
          column_name: 'codigo',
          data_type: 'bigint',
          character_maximum_length: null,
        },
        {
          column_name: 'vazao_media',
          data_type: 'numeric',
          character_maximum_length: null,
        },
      ],
      COD_USUARIO: 'user-1',
    });

    expect(resumo.atributosAdicionados).toEqual(['vazao_media']);
    expect(resumo.atributosRemovidos).toEqual(['obs_antiga']);
    expect(resumo.atributosAlterados).toEqual([
      { nome: 'codigo', tipoAnterior: 'integer', tipoNovo: 'bigint' },
    ]);
  });

  it('nao marca como alterada coluna cujo tipo nao mudou', async () => {
    atributosRepo.itens.push(makeAtributo('codigo', { DSC_TIPO: 'integer' }));

    const resumo = await sut.execute({
      COD_CAMADA_ID: 'camada-1',
      colunas: [
        {
          column_name: 'codigo',
          data_type: 'integer',
          character_maximum_length: null,
        },
      ],
      COD_USUARIO: 'user-1',
    });

    expect(resumo.atributosAlterados).toEqual([]);
  });
});
