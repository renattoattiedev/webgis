import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface RegistroVistoria {
  id: string;
  matricula: string;
  hd: string;
  nome: string;
  numero: string;
  bairro: string;
  localidade: string;
  logradouro: string;
  ss?: string;
  selecionado?: boolean;
  // Campos adicionais para SS
  cd_atendimento?: string;
  ref_atendimento?: string;
  seq_ss?: string;
  sigla_logradouro?: string;
  dc_logradouro?: string;
  // Novos campos do backend
  servico?: string;
  operacional?: string;
  unidade?: string;
  cpfCnpj?: string;
  telefone?: string;
  referencia?: string;
  obs?: string;
}

export interface EstatisticasConsulta {
  totalLidos: number;
  totalImportados: number;
  totalNaoImportados: number;
}

@Injectable({
  providedIn: 'root',
})
export class VistoriaService {
  constructor() {}

  // Buscar por SS
  buscarPorSS(numeroSS: string): Observable<{
    registros: RegistroVistoria[];
    estatisticas: EstatisticasConsulta;
  }> {
    // Simular dados de retorno
    const registros: RegistroVistoria[] = [
      {
        id: `ss_${numeroSS}_${Date.now()}`,
        matricula: '123456',
        hd: 'HD001',
        nome: 'João Silva Santos',
        numero: '123',
        bairro: 'Centro',
        localidade: 'VILA VELHA',
        logradouro: 'Rua das Flores',
        ss: numeroSS,
      },
    ];

    const estatisticas: EstatisticasConsulta = {
      totalLidos: registros.length,
      totalImportados: registros.length,
      totalNaoImportados: 0,
    };

    return of({ registros, estatisticas }).pipe(delay(800));
  }

  // Buscar por Matrícula
  buscarPorMatricula(numeroMatricula: string): Observable<{
    registros: RegistroVistoria[];
    estatisticas: EstatisticasConsulta;
  }> {
    const registros: RegistroVistoria[] = [
      {
        id: `mat_${numeroMatricula}_${Date.now()}`,
        matricula: numeroMatricula,
        hd: 'HD003',
        nome: 'Pedro Costa Silva',
        numero: '789',
        bairro: 'Jardim Camburi',
        localidade: 'VITÓRIA',
        logradouro: 'Avenida Central',
      },
    ];

    const estatisticas: EstatisticasConsulta = {
      totalLidos: 1,
      totalImportados: 1,
      totalNaoImportados: 0,
    };

    return of({ registros, estatisticas }).pipe(delay(600));
  }

  // Buscar por Hidrômetro
  buscarPorHidrometro(numeroHidrometro: string): Observable<{
    registros: RegistroVistoria[];
    estatisticas: EstatisticasConsulta;
  }> {
    const registros: RegistroVistoria[] = [
      {
        id: `hd_${numeroHidrometro}_${Date.now()}`,
        matricula: '987654',
        hd: numeroHidrometro,
        nome: 'Ana Paula Silva',
        numero: '321',
        bairro: 'Praia do Canto',
        localidade: 'VITÓRIA',
        logradouro: 'Rua da Praia',
      },
    ];

    const estatisticas: EstatisticasConsulta = {
      totalLidos: 1,
      totalImportados: 1,
      totalNaoImportados: 0,
    };

    return of({ registros, estatisticas }).pipe(delay(500));
  }

  // Buscar por Localização
  buscarPorLocalizacao(
    localidade: string,
    logradouro?: string,
    bairro?: string,
  ): Observable<RegistroVistoria[]> {
    const todosRegistros: RegistroVistoria[] = [
      {
        id: '1',
        matricula: '111111',
        hd: 'HD005',
        nome: 'Carlos Alberto',
        numero: '100',
        bairro: 'Centro',
        localidade: 'VILA VELHA',
        logradouro: 'Rua Principal',
      },
      {
        id: '2',
        matricula: '222222',
        hd: 'HD006',
        nome: 'Fernanda Lima',
        numero: '200',
        bairro: 'Centro',
        localidade: 'VILA VELHA',
        logradouro: 'Rua Principal',
      },
      {
        id: '3',
        matricula: '333333',
        hd: 'HD007',
        nome: 'Roberto Santos',
        numero: '300',
        bairro: 'Jardim Camburi',
        localidade: 'VITÓRIA',
        logradouro: 'Avenida Secundária',
      },
    ];

    // Filtrar por critérios
    let registrosFiltrados = todosRegistros.filter((registro) =>
      registro.localidade.toUpperCase().includes(localidade.toUpperCase()),
    );

    if (logradouro && logradouro.trim()) {
      registrosFiltrados = registrosFiltrados.filter((registro) =>
        registro.logradouro.toLowerCase().includes(logradouro.toLowerCase()),
      );
    }

    if (bairro && bairro.trim()) {
      registrosFiltrados = registrosFiltrados.filter((registro) =>
        registro.bairro.toLowerCase().includes(bairro.toLowerCase()),
      );
    }

    return of(registrosFiltrados).pipe(delay(700));
  }

  // Imprimir croqui
  imprimirCroqui(
    registros: any[],
  ): Observable<{ sucesso: boolean; mensagem: string }> {
    console.log('Enviando para impressão:', registros);

    // Simular processo de impressão
    const sucesso = Math.random() > 0.1; // 90% de chance de sucesso
    const mensagem = sucesso
      ? `${registros.length} croqui(s) enviado(s) para impressão com sucesso!`
      : 'Erro ao processar impressão. Tente novamente.';

    return of({ sucesso, mensagem }).pipe(delay(1500));
  }

  // Validar dados antes da impressão
  validarDadosImpressao(registros: any[]): {
    valido: boolean;
    erros: string[];
  } {
    const erros: string[] = [];

    if (registros.length === 0) {
      erros.push('Nenhum registro selecionado para impressão.');
    }

    registros.forEach((registro, index) => {
      if (!registro.matricula && !registro.codigo) {
        erros.push(`Registro ${index + 1}: Identificação não informada.`);
      }
    });

    return {
      valido: erros.length === 0,
      erros,
    };
  }
}
