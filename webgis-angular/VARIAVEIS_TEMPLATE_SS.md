# Variáveis do Template SS - Status de Implementação

## ✅ Variáveis IMPLEMENTADAS (dados disponíveis do backend)

Estas variáveis estão sendo preenchidas com os dados retornados pelo endpoint `/fetch-solicitacao-servicos-detalhada/{codigo}`:

### Cabeçalho
- `{{SS_TITLE}}` - Título fixo: "SOLICITAÇÃO DE SERVIÇO - CESAN"
- `{{SS_SUBTITLE}}` - Subtítulo com cd_atendimento: "Atendimento: {cd_atendimento}"
- `{{SS_NUMBER}}` - Número da SS (ref_atendimento ou cd_atendimento)

### Dados do Cliente
- `{{CLIENT_NAME}}` - Nome do cliente (nome_cliente_interno)
- `{{MATRICULA}}` - Matrícula do imóvel (matricula_imovel)
- `{{LOGRADOURO}}` - Logradouro completo (sigla_logradouro + dc_logradouro)
- `{{NUMERO}}` - Número do endereço (numero_endereco)
- `{{BAIRRO}}` - Bairro (dc_bairro)
- `{{CITY}}` - Município (dc_cidade)

### Variáveis Comuns
- `{{MAP_CONTENT}}` - Imagem do mapa capturado
- `{{AUTHOR}}` - Autor: "Sistema WebGIS"
- `{{DATE}}` - Data e hora atual da impressão
- `{{SEQUENCIA}}` - Número de sequência (se configurado)
- `{{OBSERVACOES}}` - Observações (se disponível no registro)

## ⏳ Variáveis PENDENTES (aguardando implementação futura)

Estas variáveis estão marcadas com "A preencher" e necessitam de dados adicionais do backend:

### Dados da Solicitação de Serviço
- `{{OPERACIONAL}}` - Operacional responsável
- `{{SERVICO_COD}}` - Código do serviço
- `{{SERVICO_DESC}}` - Descrição do serviço
- `{{UNIDADE}}` - Unidade responsável
- `{{REQUEST_DATE}}` - Data de solicitação
- `{{DUE_DATE}}` - Prazo de atendimento
- `{{DESCRIPTION}}` - Descrição detalhada da SS

### Dados do Cliente (complementares)
- `{{CPF_CNPJ}}` - CPF ou CNPJ do cliente
- `{{HIDROMETRO}}` - Número do hidrômetro (atualmente fixo como "N/A")
- `{{TELEFONE}}` - Telefone de contato
- `{{REFERENCIA}}` - Ponto de referência

## 📋 Resposta Atual do Backend

```json
{
    "solicitacoes": [
        {
            "cd_atendimento": "39010",
            "ref_atendimento": "202106",
            "matricula_imovel": "746994",
            "nome_cliente_interno": "ALZILEIA DA SILVA DIAS DE FARIA",
            "sigla_logradouro": "RUA",
            "dc_logradouro": "PERNAMBUCO",
            "numero_endereco": "709",
            "dc_bairro": "PRAIA GRANDE",
            "dc_cidade": "PRAIA GRANDE"
        }
    ],
    "success": true,
    "message": "1 solicitação(ões) de serviços encontrada(s) para ref_atendimento 202106"
}
```

## 🔧 Próximos Passos para Implementação Completa

Para preencher todas as variáveis do template, será necessário:

1. **Expandir a resposta do backend** para incluir:
   - Dados operacionais (operacional, unidade)
   - Detalhes do serviço (código, descrição)
   - Datas (solicitação, prazo)
   - Informações do cliente (CPF/CNPJ, telefone)
   - Dados técnicos (hidrômetro, referências)

2. **Atualizar o modelo TypeScript** (`SolicitacaoServicosDetalhadaResponse`) com os novos campos

3. **Ajustar o método `substituirVariaveisTemplate`** para mapear os novos campos recebidos

## 💡 Possíveis Fontes de Dados Adicionais

Os services disponíveis no sistema que podem complementar os dados:

- `FetchSicatImovelService` - Pode fornecer dados adicionais da matrícula (incluindo hidrômetro)
- `FetchSicatImovelByHidrometroService` - Dados detalhados do hidrômetro
- `FetchSicatBairrosService` - Informações complementares do bairro
- `FetchSicatLogradourosService` - Dados do logradouro
- `FetchSicatCidadesService` - Informações da cidade

### Sugestão de Enriquecimento Automático

Se o backend não puder retornar todos os dados, pode-se fazer uma chamada adicional ao serviço `FetchSicatImovelService` usando a matrícula retornada para obter:
- Hidrômetro
- Telefone
- CPF/CNPJ
- Outras informações cadastrais

## 📝 Nota

O template SS continua funcional com as variáveis disponíveis. As variáveis pendentes exibem "A preencher" no documento impresso, sinalizando claramente quais campos precisam ser completados manualmente ou aguardam implementação.
