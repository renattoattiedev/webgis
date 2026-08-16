import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ComponenteSeed {
    NOM_NOME_COMPONENTE: string;
    DSC_DESCRICAO?: string | null;
    JSON_CONFIGURACAO: any;
    FLG_HABILITADO: boolean;
}

export class SeedComponente {
    async run() {
        const componentes: ComponenteSeed[] = [
            {
                NOM_NOME_COMPONENTE: 'imprimir-croqui',
                DSC_DESCRICAO: 'Componente para imprimir croqui',
                JSON_CONFIGURACAO: {
                    "version": 1,
                    "camada_alvo": {
                        "tema": null,
                        "grupo": null,
                        "camada": null,
                        "camadaNome": "",
                        "campoChave": null
                    },
                    "camada_alvo_ss": {
                        "tema": null,
                        "grupo": null,
                        "camada": null,
                        "camadaNome": "",
                        "campoChave": null
                    },
                    "camadas": [],
                    "templates": [
                        {
                            "id": "croqui",
                            "type": "html",
                            "template": ""
                        },
                        {
                            "id": "ss",
                            "type": "html",
                            "template": ""
                        }
                    ]
                },
                FLG_HABILITADO: false,
            },
            {
                NOM_NOME_COMPONENTE: 'pitometria',
                DSC_DESCRICAO: 'Componente para cadastro e visualização de pontos de pitometria no mapa',
                JSON_CONFIGURACAO: {
                    version: 1,
                    camada_alvo: {
                        camada: '',
                        nomeCamada: 'pitometria',
                        workspace: 'content',
                    },
                },
                FLG_HABILITADO: false,
            },
        ];


        for (const componente of componentes) {

            await prisma.componente.create({
                data: {
                    NOM_NOME_COMPONENTE: componente.NOM_NOME_COMPONENTE,
                    DSC_DESCRICAO: componente.DSC_DESCRICAO,
                    JSON_CONFIGURACAO: componente.JSON_CONFIGURACAO,
                    FLG_HABILITADO: componente.FLG_HABILITADO,
                },
            });
        }
    }
}