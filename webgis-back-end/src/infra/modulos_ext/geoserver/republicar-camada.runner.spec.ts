import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RepublicarCamadaRunner } from './republicar-camada.runner';
import { ReconciliarAtributosService } from '@/domain/camadas/application/services/reconciliar-atributos.service';
import { InMemoryCamadasRepository } from '../../../../test/repositories/in-memory-camadas-repository';
import { InMemoryAtributosRepository } from '../../../../test/repositories/in-memory-atributos-repository';
import { InMemoryPublicacaoHistoricoRepository } from '../../../../test/repositories/in-memory-publicacao-historico-repository';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

function makeCamada(id: string) {
  return Camadas.create(
    {
      NOM_NOME: 'dmc_limites',
      DSC_TITULO: 'DMC',
      DSC_DESCRICAO: 'descrição',
      DSC_LINK_METADADOS: '',
      TXT_TERMOS_DE_USO: '',
      NIVEL_COMPATILHAMENTO: 'nivel-1',
      GRUPOS_CAMADAS: 'g1',
      TXT_TAGS: '',
      PACOTES_CONCEITUAIS: 'pacote-1',
      DSC_FONTE_DADOS_CAMADA: '',
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: 'criador-item',
      FLG_CAMADA_ATIVA: true,
    },
    new UniqueEntityID(id),
  );
}

describe('RepublicarCamadaRunner', () => {
  let camadasRepo: InMemoryCamadasRepository;
  let atributosRepo: InMemoryAtributosRepository;
  let historicoRepo: InMemoryPublicacaoHistoricoRepository;
  let colunasProvider: { listarColunas: ReturnType<typeof vi.fn> };
  let geoserver: {
    atualizarCamada: ReturnType<typeof vi.fn>;
    truncarCache: ReturnType<typeof vi.fn>;
    obterBoundingBox: ReturnType<typeof vi.fn>;
    obterNomePacoteConceitual: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    camadasRepo = new InMemoryCamadasRepository();
    atributosRepo = new InMemoryAtributosRepository();
    historicoRepo = new InMemoryPublicacaoHistoricoRepository();
    camadasRepo.itens.push(makeCamada('camada-1'));

    colunasProvider = {
      listarColunas: vi.fn().mockResolvedValue([
        {
          column_name: 'codigo',
          data_type: 'integer',
          character_maximum_length: null,
        },
      ]),
    };
    geoserver = {
      atualizarCamada: vi.fn().mockResolvedValue(undefined),
      truncarCache: vi.fn().mockResolvedValue(undefined),
      obterBoundingBox: vi.fn().mockResolvedValue({ minx: 0 }),
      obterNomePacoteConceitual: vi.fn().mockResolvedValue('infraestrutura'),
    };
  });

  function sut() {
    return new RepublicarCamadaRunner(
      camadasRepo,
      colunasProvider as any,
      geoserver as any,
      new ReconciliarAtributosService(atributosRepo),
      historicoRepo,
    );
  }

  function camada() {
    return camadasRepo.itens.find((c) => c.id.toString() === 'camada-1')!;
  }

  it('republica com sucesso: chama o GeoServer, reconcilia atributos e marca published', async () => {
    await sut().republicar('camada-1', 'user-1');

    expect(geoserver.atualizarCamada).toHaveBeenCalledWith(
      'dmc_limites',
      'infraestrutura',
    );
    expect(geoserver.truncarCache).toHaveBeenCalledWith('dmc_limites');
    expect(camada().camadaStatus).toBe('published');
    expect(camada().camadaErrorMsg).toBeNull();
    expect(historicoRepo.registros[0]).toMatchObject({
      tipo: 'camada',
      operacao: 'sobrescrita',
      status: 'sucesso',
    });
  });

  it('falha do GeoServer aborta antes de tocar nos atributos, marca error e registra o erro', async () => {
    geoserver.atualizarCamada.mockRejectedValue(new Error('500 do GeoServer'));

    await sut().republicar('camada-1', 'user-1');

    expect(atributosRepo.itens).toHaveLength(0);
    expect(camada().camadaStatus).toBe('error');
    expect(camada().camadaErrorMsg).toContain('500 do GeoServer');
    expect(historicoRepo.registros[0]).toMatchObject({
      status: 'erro',
      operacao: 'sobrescrita',
    });
    expect(historicoRepo.registros[0].errorMsg).toContain('500 do GeoServer');
  });

  it('falha na leitura das colunas aborta sem chamar o GeoServer', async () => {
    colunasProvider.listarColunas.mockRejectedValue(new Error('PostGIS fora'));

    await sut().republicar('camada-1', 'user-1');

    expect(geoserver.atualizarCamada).not.toHaveBeenCalled();
    expect(camada().camadaStatus).toBe('error');
  });

  it('falha ao obter o nome do pacote conceitual aborta e registra o erro', async () => {
    geoserver.obterNomePacoteConceitual.mockRejectedValue(
      new Error('pacote nao encontrado'),
    );

    await sut().republicar('camada-1', 'user-1');

    expect(geoserver.atualizarCamada).not.toHaveBeenCalled();
    expect(camada().camadaStatus).toBe('error');
    expect(historicoRepo.registros[0]).toMatchObject({
      status: 'erro',
      operacao: 'sobrescrita',
    });
    expect(historicoRepo.registros[0].errorMsg).toContain(
      'pacote nao encontrado',
    );
  });
});
