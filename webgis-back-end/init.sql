CREATE SERVER IF NOT EXISTS servidor_giscesan
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (
        host 'localhost',  -- substitua pelo host correto do banco giscesan
        port '5432',       -- substitua pela porta correta
        dbname 'giscesan'
    );

CREATE USER MAPPING IF NOT EXISTS FOR portalgis
    SERVER servidor_giscesan
    OPTIONS (
        user 'portalgis',
        password 'giscesan'
    );



	CREATE FOREIGN TABLE IF NOT EXISTS webgis_sicat_cidade (
    cd_cidade bigint,
    cd_municipio bigint,
    dc_cidade text COLLATE pg_catalog."default"
)
SERVER servidor_giscesan
OPTIONS (
    schema_name 'integracao',
    table_name 'sicat_cidade'
);


CREATE FOREIGN TABLE IF NOT EXISTS webgis_sicat_bairro (
    cd_cidade bigint,
    cd_bairro bigint,
    dc_bairro text COLLATE pg_catalog."default",
    cd_mun_impressao bigint
)
SERVER servidor_giscesan
OPTIONS (
    schema_name 'integracao',
    table_name 'sicat_bairro'
);



CREATE FOREIGN TABLE IF NOT EXISTS webgis_sicat_cliente (
    nome_cliente_interno text COLLATE pg_catalog."default",
    cpf_cnpj text COLLATE pg_catalog."default",
    cd_cliente bigint,
    tipo_cliente text COLLATE pg_catalog."default"
)
SERVER servidor_giscesan
OPTIONS (
    schema_name 'integracao',
    table_name 'sicat_cliente'
);



CREATE FOREIGN TABLE IF NOT EXISTS webgis_sicat_logradouro (
    cd_cidade bigint,
    cd_logradouro bigint,
    sigla_logradouro text COLLATE pg_catalog."default",
    dc_logradouro text COLLATE pg_catalog."default"
)
SERVER servidor_giscesan
OPTIONS (
    schema_name 'integracao',
    table_name 'sicat_logradouro'
);


CREATE FOREIGN TABLE IF NOT EXISTS webgis_sicat_imovel (
    matricula_imovel bigint,
    dv bigint,
    cliente_especial text COLLATE pg_catalog."default",
    data_ligacao_agua timestamp,
    data_ligacao_esgoto timestamp,
    numero_economias bigint,
    tratamento_esgoto text COLLATE pg_catalog."default",
    ciclo_leitura bigint,
    seq_rota bigint,
    cep bigint,
    cd_logradouro bigint,
    cd_cidade bigint,
    cd_bairro bigint,
    row_version bigint,
    numero_endereco text COLLATE pg_catalog."default",
    complemento_endereco text COLLATE pg_catalog."default",
    grupo_consumo bigint,
    cd_cliente bigint,
    categoria bigint,
    otr_fonte bigint,
    tp_ligacao_agua bigint,
    sit_ligacao_agua bigint,
    sit_ligacao_esgoto bigint
)
SERVER servidor_giscesan
OPTIONS (
    schema_name 'integracao',
    table_name 'sicat_imovel'
);

CREATE FOREIGN TABLE IF NOT EXISTS public.webgis_integracao_solicitacao_servico(
		num_ss text, 
		servico text, 
		operacional text, 
		unidade text, 
		cliente text, 
		cpf_cnpj text, 
		matricula text, 
		dv bigint, 
		hidrometro text, 
		logradouro text, 
		num_imovel text, 
		telefone text, 
		bairro text, 
		referencia text, 
		obs text, 
		cd_atendimento bigint, 
		ref_atendimento bigint, 
		seq_ss bigint
)
    SERVER servidor_giscesan
    OPTIONS (schema_name 'integracao', table_name 'vw_dados_croquis_ss');



CREATE FOREIGN TABLE IF NOT EXISTS webgis_sicat_hidrometro_imovel (
    matricula_imovel bigint,
    codigo_hidrometro text
)
SERVER servidor_giscesan
OPTIONS (
    schema_name 'integracao',
    table_name 'sicat_hidrometro_imovel'
);

-- View: outros.vw_solicitacao_servico

-- DROP VIEW outros.vw_solicitacao_servico;

CREATE OR REPLACE VIEW outros.vw_solicitacao_servico
 AS
 SELECT id,
    (((lpad("substring"(ref_atendimento::text, 5, 2), 2, '0'::text) || '/'::text) || "substring"(ref_atendimento::text, 3, 2)) || '-'::text) || lpad(cd_atendimento::text, 6, '0'::text) AS num_ss,
    cd_atendimento,
    ref_atendimento,
    seq_ss,
    dt_registro,
    dt_georref,
    matricula_imovel,
    matricula_vizinho,
    matricula_ref,
    tipo_posicionamento,
    row_version,
    geometry
   FROM outros.solicitacao_servico ss;

ALTER TABLE outros.vw_solicitacao_servico
    OWNER TO postgres;

GRANT SELECT ON TABLE outros.vw_solicitacao_servico TO ambiental;
GRANT SELECT ON TABLE outros.vw_solicitacao_servico TO cadambiental;
GRANT INSERT, DELETE, SELECT, UPDATE ON TABLE outros.vw_solicitacao_servico TO caminhamento;
GRANT INSERT, DELETE, SELECT, UPDATE ON TABLE outros.vw_solicitacao_servico TO diretor;
GRANT ALL ON TABLE outros.vw_solicitacao_servico TO gis_scripts;
GRANT SELECT ON TABLE outros.vw_solicitacao_servico TO giscesan;
GRANT SELECT ON TABLE outros.vw_solicitacao_servico TO observador;
GRANT INSERT, DELETE, SELECT, UPDATE ON TABLE outros.vw_solicitacao_servico TO portalgis;
GRANT ALL ON TABLE outros.vw_solicitacao_servico TO postgres;
GRANT INSERT, DELETE, SELECT, UPDATE ON TABLE outros.vw_solicitacao_servico TO srae;

