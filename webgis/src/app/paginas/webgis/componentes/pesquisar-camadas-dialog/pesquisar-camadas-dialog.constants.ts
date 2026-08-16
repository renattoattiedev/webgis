import {
  ConfigCamadaFiltro,
  TipoConsultaConfig,
} from './pesquisar-camadas-dialog.types';

export const TIPOS_CONSULTA: TipoConsultaConfig[] = [
  {
    id: 'matricula',
    label: 'Matrícula',
    keywords: [
      'matricula',
      'matrícula',
      'numero_matricula',
      'matricula_imovel',
      'cd_matricula',
    ],
  },
  {
    id: 'codigo_hidrometro',
    label: 'Código Hidrômetro',
    keywords: [
      'cd_hidrometro',
      'codigo_hidrometro',
      'codigo hidrometro',
      'cd hidrometro',
    ],
  },
  {
    id: 'nome_cliente',
    label: 'Nome do Cliente',
    keywords: [
      'nome_cliente',
      'nome do cliente',
      'nome_titular',
      'titular',
      'cliente',
      'usuario',
    ],
  },
  {
    id: 'cpf_cnpj',
    label: 'CPF/CNPJ',
    keywords: ['cpf', 'cnpj', 'cpf_cnpj', 'documento', 'cgc'],
  },
  {
    id: 'logradouros',
    label: 'Logradouros',
    keywords: [
      'logradouro',
      'logradouros',
      'nome_logradouro',
      'endereco',
      'endereço',
    ],
  },
  {
    id: 'bairros',
    label: 'Bairros',
    keywords: ['bairro', 'bairros', 'nome_bairro'],
  },
  {
    id: 'eta',
    label: 'Estação de Tratamento de Água',
    keywords: [
      'estacao_tratamento_agua',
      'eta',
      'tratamento de água',
      'estação de tratamento',
    ],
  },
  {
    id: 'eea',
    label: 'Estação Elevatória de Água',
    keywords: [
      'estacao_elevatoria_agua',
      'eea',
      'elevatória de água',
      'elevatoria agua',
    ],
  },
  {
    id: 'reservatorio',
    label: 'Reservatório',
    keywords: ['reservatorio', 'reservatório', 'reservatorios'],
  },
  {
    id: 'ete',
    label: 'Estação de Tratamento de Esgoto',
    keywords: [
      'estacao_tratamento_esgoto',
      'ete',
      'tratamento de esgoto',
      'estação de tratamento esgoto',
    ],
  },
  {
    id: 'eee',
    label: 'Estação Elevatória de Esgoto',
    keywords: [
      'estacao_elevatoria_esgoto',
      'eee',
      'elevatória de esgoto',
      'elevatoria esgoto',
    ],
  },
];

export const CAMADAS_FILTRO_DEFAULT: ConfigCamadaFiltro[] = [
  {
    id: 'vw_ligacao',
    nomeCamada: 'vw_ligacao',
    titulo: 'Ligação',
    colunaPorTipo: {
      matricula: 'matricula',
      codigo_hidrometro: 'Hidrômetro',
      cpf_cnpj: 'CPF-CNPJ',
      nome_cliente: 'usuario',
    },
  },
  {
    id: 'logradouro',
    nomeCamada: 'logradouro',
    titulo: 'Logradouro',
    colunaPorTipo: { logradouros: 'nome_rua' },
    agruparPor: 'nome_rua',
  },
  {
    id: 'vw_bairro',
    nomeCamada: 'vw_bairro',
    titulo: 'Bairro',
    colunaPorTipo: { bairros: 'nome' },
  },
  {
    id: 'hidrantes',
    nomeCamada: 'hidrantes',
    titulo: 'Hidrantes',
    colunaPorTipo: { hidrante: 'id_hidrante' },
  },
  {
    id: 'vw_eta',
    nomeCamada: 'vw_eta',
    titulo: 'Estação de Tratamento de Água',
    colunaPorTipo: { eta: 'nome' },
  },
  {
    id: 'vw_eea_estacao_elevatoria',
    nomeCamada: 'vw_eea_estacao_elevatoria',
    titulo: 'Estação Elevatória de Água',
    colunaPorTipo: { eea: 'nome' },
  },
  {
    id: 'vw_reservatorio',
    nomeCamada: 'vw_reservatorio',
    titulo: 'Reservatório',
    colunaPorTipo: { reservatorio: 'nome' },
  },
  {
    id: 'vw_ete',
    nomeCamada: 'vw_ete',
    titulo: 'Estação de Tratamento de Esgoto',
    colunaPorTipo: { ete: 'nome' },
  },
  {
    id: 'vw_eee',
    nomeCamada: 'vw_eee',
    titulo: 'Estação Elevatória de Esgoto',
    colunaPorTipo: { eee: 'nome' },
  },
];
