import { Get, Module } from '@nestjs/common';
import { FetchIndicadoresController } from './controllers/fetch-indicadores.controller';
import { FetchDadosCatalogoController } from './controllers/fetch-dados-catalogo.controller';
import { AuthenticateController } from './controllers/authenticate.controller';
import { AuthenticateUserUseCase } from '@/domain/security/application/use-cases/authenticate-user';
import { AuthenticateEntraController } from './controllers/authenticate-entra.controller';
import { AuthenticateEntraUserUseCase } from '@/domain/security/application/use-cases/authenticate-entra-user';
import { EntraOidcService } from '@/infra/auth/entra-oidc.service';
import { CreateAccountController } from './controllers/create-account.controller';
import { FetchContentOrganizationController } from './controllers/fetch-content-organization.controller';
import { FetchCamadasUseCase } from '@/domain/camadas/application/use-cases/fetch-camadas';
import { DatabaseModule } from '../database/database.module';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { RegisterUserUseCase } from '@/domain/security/application/use-cases/register-user';
import { CreateCamadaController } from './controllers/create-camadas.controller';
import { CreateCamadaUseCase } from '@/domain/camadas/application/use-cases/create-camada';
import { FetchTemasController } from './controllers/fetch-temas.controller';
import { FetchTemasUseCase } from '@/domain/manager/application/use-cases/fetch-temas';
import { FetchGrupoController } from './controllers/fetch-grupo.controller';
import { FetchGrupoUseCase } from '@/domain/manager/application/use-cases/fetch-grupo';
import { FetchGrupoTemaController } from './controllers/fetch-grupo-tema.controller';
import { FetchGrupoTemasUseCase } from '@/domain/manager/application/use-cases/fetch-grupo-tema';
import { FetchContentGrupoController } from './controllers/fetch-content-grupo.controller';
import { FetchCamadasGrupoUseCase } from '@/domain/camadas/application/use-cases/fetch-camadas-grupo';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';
import { FetchPacotesConceituaisController } from './controllers/fetch-pacotes-conceituais.controller';
import { FetchNivelCompartilhamentoController } from './controllers/fetch-nivel-compartilhamento.controller';
import { FetchNivelCompartilhamentoUseCase } from '@/domain/manager/application/use-cases/fetch-nivel-compartilhamento';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { GeoserverModule } from '../modulos_ext/geoserver/geoserver.module';
import { UploadEstiloController } from './controllers/upload-estilo-camada.controller';
import { DadosCamadaController } from './controllers/fetch-camadas-dados.controller';
import { ExtentCamadaController } from './controllers/get-camadas-extent';
import { EditCamadasController } from './controllers/edit-camadas.controller';
import { EditCamadaUseCase } from '@/domain/camadas/application/use-cases/edit-camada';
import { GetUserUseCase } from '@/domain/security/application/use-cases/get-user';
import { FetchAtributosCamadasController } from './controllers/fetch-atributos-camadas.controller';
import { FetchAtributosCamadasUseCase } from '@/domain/camadas/application/use-cases/fetch-atributos-camadas';
import { CreateFolderController } from './controllers/create-folder.controller';
import { CreateFolderUseCase } from '@/domain/folder/application/use-cases/create-folder';
import { UpdateFolderController } from './controllers/update-folder.controller';
import { UpdateFolderUseCase } from '@/domain/folder/application/use-cases/update-folder';
import { AssociateFolderCamadaController } from './controllers/associate-folders-camada.controller';
import { AssociateFolderCamadaUseCase } from '@/domain/folder/application/use-cases/associate-folder-camada';
import { FetchFoldersCamadasController } from './controllers/fetch-folders-content.controller';
import { FetchFolderContentUseCase } from '@/domain/folder/application/use-cases/fetch-folder-content';
import { FetchFoldersController } from './controllers/fetch-folders.controller';
import { FetchFoldersUseCase } from '@/domain/folder/application/use-cases/fetch-folders';
import { DeleteFolderController } from './controllers/delete-folder.controller';
import { DeleteFolderUseCase } from '@/domain/folder/application/use-cases/delete-folder';
import { ChangeCamadaFolderController } from './controllers/change-folder-content.controller';
import { DeleteCamadaFolderUseCase } from '@/domain/folder/application/use-cases/delete-camadas-folder';
import { FetchCamadasFoldersUseCase } from '@/domain/folder/application/use-cases/fetch-camadas-folders';
import { GetPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil';
import { VerifyAccountUseCase } from '@/domain/security/application/use-cases/verify-account';
import { VerifyAccountController } from './controllers/verify-account.controller';
import { EmailModule } from '../modulos_ext/email/email/email.module';
import { RecoveryPassowrdController } from './controllers/recovery-password.controller';
import { ResetPasswordUseCase } from '@/domain/security/application/use-cases/reset-password';
import { ResetPasswordController } from './controllers/reset-password.controller';
import { SavePasswordResetUseCase } from '@/domain/security/application/use-cases/save-password-reset-user';
import { GetUserEmailUseCase } from '@/domain/security/application/use-cases/get-user-email';
import { ReCAPTCHAModule } from '../modulos_ext/reCAPTCHA/reCAPTCHA.module';
import { RegisterLastLoginUseCase } from '@/domain/security/application/use-cases/register-last-login';
import { FetchUsersController } from './controllers/fetch-users.controller';
import { FetchUsersUseCase } from '@/domain/security/application/use-cases/fetch-users';
import { FetchPerfilUseCase } from '@/domain/security/application/use-cases/fetch-perfil';
import { FetchPerfilController } from './controllers/fetch-perfil.controller';
import { UpdatePerfilController } from './controllers/update-perfil.controller';
import { UpdatePerfilUserUseCase } from '@/domain/security/application/use-cases/update-perfil-user';
import { DeleteUserController } from './controllers/delete-user.controller';
import { RecoveryUserController } from './controllers/recovery-user.controller';
import { DeleteUserUseCase } from '@/domain/security/application/use-cases/delete-user';
import { RecoveryUserUseCase } from '@/domain/security/application/use-cases/recovery-user';
import { FetchContentUserController } from './controllers/fetch-content-usuario.controller';
import { FetchContentUserUseCase } from '@/domain/manager/application/use-cases/fetch-content-user';
import { FetchUsersOwnersCamadasController } from './controllers/fetch-usuarios-donos-content.controller';
import { UpdateOwnerCamadaUseCase } from '@/domain/camadas/application/use-cases/update-camada-owner';
import { UpdateCamadaOwnerController } from './controllers/update-camada-owner.controller';
import { FetchUsersProfileUseCase } from '@/domain/security/application/use-cases/fetch-users-profile';
import { DeleteCamadaController } from './controllers/delete-camada.controller';
import { RecoveryCamadaController } from './controllers/recovery-camada.controller';
import { DeleteCamadaUseCase } from '@/domain/camadas/application/use-cases/delete-camada';
import { RecoveryCamadaUseCase } from '@/domain/camadas/application/use-cases/recovery-camada';
import { UpdateCamadaUseCase } from '@/domain/camadas/application/use-cases/update-camada';
import { UpdateAtributosCamadaController } from './controllers/update-atributos-camada.controller';
import { UpdateAtributoUseCase } from '@/domain/camadas/application/use-cases/update-atributos-camada';
import { FetchAtributosCamadasManagerController } from './controllers/fetch-atributos-camadas-manager.controller';
import { ActivateCamadaController } from './controllers/activate-camada.controller';
import { ActivateCamadaUseCase } from '@/domain/camadas/application/use-cases/activate-camada';
import { DeactivateCamadaUseCase } from '@/domain/camadas/application/use-cases/deactivate-camada';
import { CreateLogCamadaController } from './controllers/create-log-camada.controller';
import { RegisterLogCamadaUseCase } from '@/domain/camadas/application/use-cases/register-log-camada';
import { GetAcessosCamadaController } from './controllers/get-acessos-camada.controller';
import { GetAcessosCamadaUseCase } from '@/domain/camadas/application/use-cases/get-acessos-camada';
import { FavoriteContentController } from './controllers/favorite-content.controller';
import { RegisterCamadaFavoritaUseCase } from '@/domain/camadas/application/use-cases/register-camada-favorita';
import { DeleteCamadaFavoritaUseCase } from '@/domain/camadas/application/use-cases/delete-camada-favorita';
import { CheckCamadaFavoritaUseCase } from '@/domain/camadas/application/use-cases/check-camada-favorita';
import { CreatePacoteConceitualController } from './controllers/create-pacote-conceitual.controller';
import { CreatePacoteConceitualUseCase } from '@/domain/manager/application/use-cases/create-pacote-conceitual';
import { UpdatePacoteConceitualController } from './controllers/update-pacote-conceitual.controller';
import { UpdatePacoteConceitualUseCase } from '@/domain/manager/application/use-cases/update-pacote-conceitual';
import { FetchCamadasPublicaveisController } from './controllers/fetch-camadas-publicaveis.controller';
import { MetadadosPostgisModule } from '@/infra/modulos_ext/metadados-postgis/metadados-postgis.module';
import { CreateAtributosUseCase } from '@/domain/camadas/application/use-cases/create-atributos';
import { DeletePacoteConceitualUseCase } from '@/domain/manager/application/use-cases/delete-pacote-conceitual';
import { DeletePacoteConceitualController } from './controllers/delete-pacote-conceitual.controller';
import { CreateTemaController } from './controllers/create-tema.controller';
import { CreateTemaUseCase } from '@/domain/manager/application/use-cases/create-tema';
import { UpdateTemaController } from './controllers/update-tema.controller';
import { UpdateTemaUseCase } from '@/domain/manager/application/use-cases/update-tema';
import { DeleteTemaController } from './controllers/delete-tema.controller';
import { DeleteTemaUseCase } from '@/domain/manager/application/use-cases/delete-tema';
import { GetTemaUseCase } from '@/domain/manager/application/use-cases/get-tema';
import { CreateGrupoCamadaController } from './controllers/create-grupo.controller';
import { CreateGrupoUseCase } from '@/domain/manager/application/use-cases/create-grupo';
import { UpdateGrupoController } from './controllers/update-grupo.controller';
import { UpdateGrupoUseCase } from '@/domain/manager/application/use-cases/update-grupo';
import { DeleteGrupoController } from './controllers/delete-grupo.controller';
import { DeleteGrupoUseCase } from '@/domain/manager/application/use-cases/delete-grupo';
import { MoverItensGrupoController } from './controllers/mover-itens-grupo.controller';
import { MoverItensGrupoUseCase } from '@/domain/manager/application/use-cases/mover-itens-grupo';
import { ConfigModule } from '@/config/config.module';
import { EnvModule } from '../env/env.module';
import { FetchConfigController } from './controllers/fetch-configs.controller';
import { FetchConfigsUseCase } from '@/domain/manager/application/use-cases/fetch-configs';
import { UpdateConfigController } from './controllers/update-config.controller';
import { UpdateConfiglUseCase } from '@/domain/manager/application/use-cases/update-config';
import { SaveMapaController } from './controllers/save-mapas.controller';
import { CreateMapaUseCase } from '@/domain/mapas/application/use-cases/create-mapa';
import { GetMapaNomeUseCase } from '@/domain/mapas/application/use-cases/get-mapa-nome';
import { UpdateMapaUseCase } from '@/domain/mapas/application/use-cases/update-mapa';
import { DeleteCamadaMapaUseCase } from '@/domain/mapas/application/use-cases/delete-camadas-mapa';
import { AssociateMapaCamadaUseCase } from '@/domain/mapas/application/use-cases/associate-mapa-camada';
import { RegisterMapaFavoritoUseCase } from '@/domain/mapas/application/use-cases/register-mapa-favorito';
import { DeleteMapaFavoritoUseCase } from '@/domain/mapas/application/use-cases/delete-mapa-favorito';
import { CheckMapaFavoritoUseCase } from '@/domain/mapas/application/use-cases/check-mapa-favorito';
import { DeleteMapaFolderUseCase } from '@/domain/folder/application/use-cases/delete-mapas-folder';
import { FetchMapasFoldersUseCase } from '@/domain/folder/application/use-cases/fetch-mapas-folders';
import { AssociateFolderMapaUseCase } from '@/domain/folder/application/use-cases/associate-folder-mapa';
import { UpdateMapaOwnerController } from './controllers/update-mapa-owner.controller';
import { UpdateOwnerMapaUseCase } from '@/domain/mapas/application/use-cases/update-mapa-owner';
import { GetFolderMapaUseCase } from '@/domain/folder/application/use-cases/get-folder-mapa';
import { GetFolderCamadaUseCase } from '@/domain/folder/application/use-cases/get-folder-camada';
import { CreateLogMapaController } from './controllers/create-log-mapa.controller';
import { GetAcessosMapaController } from './controllers/get-acessos-mapa.controller';
import { RegisterLogMapaUseCase } from '@/domain/mapas/application/use-cases/register-log-mapa';
import { GetAcessosMapaUseCase } from '@/domain/mapas/application/use-cases/get-acessos-mapa';
import { DeleteMapaController } from './controllers/delete-mapa.controller';
import { DeleteMapaUseCase } from '@/domain/mapas/application/use-cases/delete-mapa';
import { FetchContentOrganizationUseCase } from '@/domain/manager/application/use-cases/fetch-content-organization';
import { FetchMapasGrupoUseCase } from '@/domain/mapas/application/use-cases/fetch-mapas-grupo';
import { CreateCamadasRasterController } from './controllers/create-camadas-raster.controller';
import { SessionMinioController } from './controllers/create-session-minio';
import { CreateCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/create-camada-raster';
import { EditCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/edit-camada-raster';
import { FetchCamadasRasterUseCase } from '@/domain/camadas-raster/application/use-cases/fetch-camadas-raster';
import { UpdateCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/update-camada-raster';
import { CheckCamadaRasterFavoritaUseCase } from '@/domain/camadas-raster/application/use-cases/check-camada-raster-favorita';
import { DeleteCamadaRasterFavoritaUseCase } from '@/domain/camadas-raster/application/use-cases/delete-camada-raster-favorita';
import { RegisterCamadaRasterFavoritaUseCase } from '@/domain/camadas-raster/application/use-cases/register-camada-raster-favorita';
import { DeactivateCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/deactivate-camada-raster';
import { ActivateCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/activate-camada-raster';
import { AssociateFolderCamadaRasterUseCase } from '@/domain/folder/application/use-cases/associate-folder-camada-raster';
import { DeleteCamadaRasterFolderUseCase } from '@/domain/folder/application/use-cases/delete-camadas-raster-folder';
import { FetchCamadasRasterFoldersUseCase } from '@/domain/folder/application/use-cases/fetch-camadas-raster-folders';
import { GetAcessosCamadaRasterController } from './controllers/get-acessos-camada-raster.controller';
import { GetAcessosCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/get-acessos-camada-raster';
import { UpdateCamadaRasterOwnerController } from './controllers/update-camada-raster-owner.controller';
import { UpdateOwnerCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/update-camada-raster-owner';
import { GetFolderCamadaRasterUseCase } from '@/domain/folder/application/use-cases/get-folder-camada-raster';
import { UpdateCamadaRasterController } from './controllers/update-camada-raster.controller';
import { MinioModule } from '../modulos_ext/minio/minio.module';
import { DeleteCamadaRasterController } from './controllers/delete-camada-raster.controller';
import { DeleteCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/delete-camada-raster';
import { CreateLogCamadaRasterController } from './controllers/create-log-camada-raster.controller';
import { RegisterLogCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/register-log-camada-raster';
import { AssociateMapaCamadaRasterUseCase } from '@/domain/mapas/application/use-cases/associate-mapa-camada-raster';
import { DeleteCamadaRasterMapaUseCase } from '@/domain/mapas/application/use-cases/delete-camadas-raster-mapa';
import { GetOrdemCamadaUseCase } from '@/domain/mapas/application/use-cases/get-ordem-camada';
import { GetOrdemCamadaRasterUseCase } from '@/domain/mapas/application/use-cases/get-ordem-camada-raster';
import { FetchCamadasRasterGrupoUseCase } from '@/domain/camadas-raster/application/use-cases/fetch-camadas-raster-grupo';
import { GetCamadasRasterFonteUseCase } from '@/domain/camadas-raster/application/use-cases/get-camada-raster-fonte';
import { UploadRasterProgressController } from './controllers/upload-raster-progress.controller';
import { GetCamadaRasterStatusController } from './controllers/get-camada-raster-status.controller';
import { GetCamadasUseCase } from '@/domain/camadas/application/use-cases/get-camada';
import { GetCamadaVetorialExistenteController } from './controllers/get-camada-vetorial-existente.controller';
import { GetPacotesConceituaisCamadasUseCase } from '@/domain/camadas/application/use-cases/get-pacote-conceitual-camada';
import { GetUserPerfilController } from './controllers/get-user-perfil.controller';
import { UpdateUserEmailController } from './controllers/update-user-email';
import { UpdateEmailUserUseCase } from '@/domain/security/application/use-cases/update-email-user';
import { UpdateUserPasswordController } from './controllers/update-user-password';
import { UpdatePasswordUserUseCase } from '@/domain/security/application/use-cases/update-password-user';
import { FetchSicatCidadesController } from './controllers/fetch-sicat-cidades.controller';
import { FetchSicatCidadesUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-cidades';
import { FetchSicatBairrosController } from './controllers/fetch-sicat-bairro.controller';
import { FetchSicatLogradourosController } from './controllers/fetch-sicat-logradouro.controller';
import { FetchSicatBairrosUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-bairro';
import { FetchSicatLogradourosUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-logradouro';
import { FetchSicatClientesController } from './controllers/fetch-sicat-clientes.controller';
import { FetchSicatImoveisController } from './controllers/fetch-sicat-imoveis.controller';
import { GetSicatClienteByIdController } from './controllers/get-sicat-cliente-by-id.controller';
import { GetSicatImovelByMatriculaController } from './controllers/get-sicat-imovel-by-matricula.controller';
import { FetchSicatImovelByMatriculaController } from './controllers/fetch-sicat-imovel-by-matricula.controller';
import { FetchSicatHidrometrosImoveisController } from './controllers/fetch-sicat-hidrometros-imoveis.controller';
import { FetchSicatHidrometrosByMatriculaController } from './controllers/fetch-sicat-hidrometros-by-matricula.controller';
import { FetchSicatImovelByCodigoHidrometroController } from './controllers/fetch-sicat-imovel-by-codigo-hidrometro.controller';
import { FetchSolicitacaoServicosController } from './controllers/fetch-solicitacao-servicos.controller';
import { GetSolicitacaoServicosByIdController } from './controllers/get-solicitacao-servicos-by-id.controller';
import { FetchSolicitacaoServicosByMatriculaController } from './controllers/fetch-solicitacao-servicos-by-matricula.controller';
import { FetchSolicitacaoServicosDetalhadaByRefAtendimentoController } from './controllers/fetch-solicitacao-servicos-detalhada-by-ref-atendimento.controller';
import { FetchSicatClientesUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-clientes';
import { FetchSicatImoveisUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-imoveis';
import { GetSicatClienteByIdUseCase } from '@/domain/sicat/application/use-cases/get-sicat-cliente-by-id';
import { GetSicatImovelByMatriculaUseCase } from '@/domain/sicat/application/use-cases/get-sicat-imovel-by-matricula';
import { FetchSicatImovelByMatriculaUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-imovel-by-matricula';
import { FetchSicatHidrometrosImoveisUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-hidrometros-imoveis';
import { FetchSicatHidrometrosByMatriculaUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-hidrometros-by-matricula';
import { FetchSicatImovelByCodigoHidrometroUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-imovel-by-codigo-hidrometro';
import { FetchSolicitacaoServicosUseCase } from '@/domain/sicat/application/use-cases/fetch-solicitacao-servicos';
import { GetSolicitacaoServicosByIdUseCase } from '@/domain/sicat/application/use-cases/get-solicitacao-servicos-by-id';
import { FetchSolicitacaoServicosByMatriculaUseCase } from '@/domain/sicat/application/use-cases/fetch-solicitacao-servicos-by-matricula';
import { FetchSolicitacaoServicosDetalhadaByRefAtendimentoUseCase } from '@/domain/sicat/application/use-cases/fetch-solicitacao-servicos-detalhada-by-ref-atendimento';
import { FetchCroquiEnderecoByFiltrosController } from './controllers/fetch-croqui-endereco-by-filtros.controller';
import { FetchCroquiEnderecoByFiltrosUseCase } from '@/domain/croqui/application/use-cases/fetch-croqui-endereco-by-filtros';
import { FetchComponentesController } from './controllers/fetch-componentes.controller';
import { UpdateComponenteController } from './controllers/update-componente.controller';
import { GetComponenteController } from './controllers/get-componente.controller';
import { UpdateCamadaController } from './controllers/update-camada.controller';
import { FetchComponentesUseCase } from '@/domain/manager/application/use-cases/fetch-componentes';
import { UpdateComponenteUseCase } from '@/domain/manager/application/use-cases/update-componente';
import { GetComponenteUseCase } from '@/domain/manager/application/use-cases/get-componente';
import { GetComponenteByNomeUseCase } from '@/domain/manager/application/use-cases/get-componente-nome';
import { GetComponenteByNomeController } from './controllers/get-componente-nome.controller';
import { GetUserPreferencesController } from './controllers/get-user-preferences.controller';
import { CreateUserPreferencesController } from './controllers/create-user-preferences.controller';
import { UpdateUserPreferencesController } from './controllers/update-user-preferences.controller';
import { DeleteUserPreferencesController } from './controllers/delete-user-preferences.controller';
import { GetPreferencesUseCase } from '@/domain/user/application/use-cases/get-preferences';
import { CreatePreferencesUseCase } from '@/domain/user/application/use-cases/create-preferences';
import { UpdatePreferencesUseCase } from '@/domain/user/application/use-cases/update-preferences';
import { DeletePreferencesUseCase } from '@/domain/user/application/use-cases/delete-preferences';
import { FetchCarregamentoPadraoUseCase } from '@/domain/manager/application/use-cases/fetch-carregamento-padrao';
import { FetchCarregamentoPadraoController } from './controllers/fetch-carregamento-padrao.controller';
import { FetchSolicitacaoServicosByNumSsController } from './controllers/fetch-solicitacao-servicos-by-numss.controller';
import { FetchSolicitacaoServicosByNumSsUseCase } from '@/domain/sicat/application/use-cases/fetch-solicitacao-servicos-by-numss';
import { CreateBasemapController } from './controllers/create-basemap.controller';
import { FetchBasemapsController } from './controllers/fetch-basemaps.controller';
import { GetBasemapController } from './controllers/get-basemap.controller';
import { UpdateBasemapController } from './controllers/update-basemap.controller';
import { DeleteBasemapController } from './controllers/delete-basemap.controller';
import { CreateBasemapUseCase } from '@/domain/basemaps/application/use-cases/create-basemap';
import { FetchBasemapsUseCase } from '@/domain/basemaps/application/use-cases/fetch-basemaps';
import { GetBasemapUseCase } from '@/domain/basemaps/application/use-cases/get-basemap';
import { UpdateBasemapUseCase } from '@/domain/basemaps/application/use-cases/update-basemap';
import { DeleteBasemapUseCase } from '@/domain/basemaps/application/use-cases/delete-basemap';
import { CreatePitometriaController } from './controllers/create-pitometria.controller';
import { UpdatePitometriaController } from './controllers/update-pitometria.controller';
import { UpdatePitometriaGeometryController } from './controllers/update-pitometria-geometry.controller';
import { DeletePitometriaController } from './controllers/delete-pitometria.controller';
import { FetchPitometriaController } from './controllers/fetch-pitometria.controller';
import { GetPitometriaByIdController } from './controllers/get-pitometria-by-id.controller';
import { CreatePitometriaUseCase } from '@/domain/pitometria/application/use-cases/create-pitometria';
import { UpdatePitometriaUseCase } from '@/domain/pitometria/application/use-cases/update-pitometria';
import { UpdatePitometriaGeometryUseCase } from '@/domain/pitometria/application/use-cases/update-pitometria-geometry';
import { DeletePitometriaUseCase } from '@/domain/pitometria/application/use-cases/delete-pitometria';
import { FetchPitometriaUseCase } from '@/domain/pitometria/application/use-cases/fetch-pitometria';
import { GetPitometriaByIdUseCase } from '@/domain/pitometria/application/use-cases/get-pitometria-by-id';
import { FetchPitometriaDwController } from './controllers/fetch-pitometria-dw.controller';
import { FetchPitometriaDwUseCase } from '@/domain/pitometria-dw/application/use-cases/fetch-pitometria-dw.use-case';
import { FetchPitometriaDwSpatialController } from './controllers/fetch-pitometria-dw-spatial.controller';
import { FetchPitometriaDwSpatialUseCase } from '@/domain/pitometria-dw/application/use-cases/fetch-pitometria-dw-spatial.use-case';
import { FetchRelatorioUsoController } from './controllers/fetch-relatorio-uso.controller';
import { FetchRelatorioInventarioController } from './controllers/fetch-relatorio-inventario.controller';
import { FetchRelatorioUsuariosController } from './controllers/fetch-relatorio-usuarios.controller';
import { FetchRelatorioUsoUseCase } from '@/domain/relatorios/application/use-cases/fetch-relatorio-uso';
import { FetchRelatorioInventarioUseCase } from '@/domain/relatorios/application/use-cases/fetch-relatorio-inventario';
import { FetchRelatorioUsuariosUseCase } from '@/domain/relatorios/application/use-cases/fetch-relatorio-usuarios';
import { FilesystemModule } from '@/infra/filesystem/filesystem.module';
import { ListRasterFilesUseCase } from '@/domain/raster-files/application/use-cases/list-raster-files';
import { CheckRasterAlreadyPublishedUseCase } from '@/domain/raster-files/application/use-cases/check-raster-already-published';
import { RasterFilesTreeController } from './controllers/raster-files-tree.controller';
import { GdalModule } from '@/infra/modulos_ext/gdal/gdal.module';
import { FetchGruposOverviewController } from './controllers/fetch-grupos-overview.controller';
import { FetchUsuariosDisponiveisGrupoController } from './controllers/fetch-usuarios-disponiveis-grupo.controller';
import { FetchUsuariosDisponiveisUseCase } from '@/domain/security/application/use-cases/fetch-usuarios-disponiveis';
import { GetGrupoDetalheController } from './controllers/get-grupo-detalhe.controller';
import { UpdateGrupoConfigController } from './controllers/update-grupo-config.controller';
import { GrupoMembrosController } from './controllers/grupo-membros.controller';
import { GrupoParticipacaoController } from './controllers/grupo-participacao.controller';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { FetchGruposOverviewUseCase } from '@/domain/manager/application/use-cases/fetch-grupos-overview';
import { GetGrupoDetalheUseCase } from '@/domain/manager/application/use-cases/get-grupo-detalhe';
import { UpdateGrupoConfigUseCase } from '@/domain/manager/application/use-cases/update-grupo-config';
import { AddGrupoMembroUseCase } from '@/domain/manager/application/use-cases/add-grupo-membro';
import { RemoveGrupoMembroUseCase } from '@/domain/manager/application/use-cases/remove-grupo-membro';
import { SairGrupoUseCase } from '@/domain/manager/application/use-cases/sair-grupo';
import { SolicitarParticipacaoGrupoUseCase } from '@/domain/manager/application/use-cases/solicitar-participacao-grupo';
import { ResponderSolicitacaoGrupoUseCase } from '@/domain/manager/application/use-cases/responder-solicitacao-grupo';
import { ParticiparGrupoUseCase } from '@/domain/manager/application/use-cases/participar-grupo';
import { GrupoItensController } from './controllers/grupo-itens.controller';
import { AddItemToGrupoUseCase } from '@/domain/manager/application/use-cases/add-item-to-grupo';
import { RemoveItemFromGrupoUseCase } from '@/domain/manager/application/use-cases/remove-item-from-grupo';
import { GetItensDisponiveisGrupoUseCase } from '@/domain/manager/application/use-cases/get-itens-disponiveis-grupo';
import { RepublicarCamadaController } from './controllers/republicar-camada.controller';
import { RepublicarCamadaUseCase } from '@/domain/camadas/application/use-cases/republicar-camada';
import { RepublicarCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/republicar-camada-raster';
import { ReconciliarAtributosService } from '@/domain/camadas/application/services/reconciliar-atributos.service';
import { ColunasTabelaProvider } from '@/domain/camadas/application/repositories/colunas-tabela-provider';
import { PostgisColunasTabelaProvider } from '@/infra/database/prisma/adapters/postgis-colunas-tabela-provider';
import { GeoserverCamadaGateway } from '@/domain/camadas/application/repositories/geoserver-camada-gateway';
import { GeoserverCamadaGatewayImpl } from '@/infra/modulos_ext/geoserver/geoserver-camada-gateway.impl';
import { RepublicarCamadaRunner } from '@/infra/modulos_ext/geoserver/republicar-camada.runner';
import { GetCamadaStatusController } from './controllers/get-camada-status.controller';

@Module({
  imports: [
    DatabaseModule,
    CryptographyModule,
    GeoserverModule,
    MinioModule,
    EmailModule,
    ReCAPTCHAModule,
    MetadadosPostgisModule,
    ConfigModule,
    FilesystemModule,
    GdalModule,
    EnvModule,
  ],
  controllers: [
    FetchIndicadoresController,
    FetchDadosCatalogoController,
    AuthenticateController,
    AuthenticateEntraController,
    CreateAccountController,
    VerifyAccountController,
    RecoveryPassowrdController,
    ResetPasswordController,
    CreateCamadaController,
    CreateFolderController,
    FetchTemasController,
    FetchGrupoController,
    FetchGrupoTemaController,
    FetchContentGrupoController,
    FetchContentUserController,
    FetchPacotesConceituaisController,
    FetchNivelCompartilhamentoController,
    FetchFoldersCamadasController,
    FetchFoldersController,
    UploadEstiloController,
    DadosCamadaController,
    ExtentCamadaController,
    EditCamadasController,
    FetchAtributosCamadasController,
    FetchAtributosCamadasManagerController,
    UpdateFolderController,
    AssociateFolderCamadaController,
    DeleteFolderController,
    ChangeCamadaFolderController,
    FetchUsersController,
    FetchUsersOwnersCamadasController,
    UpdateCamadaOwnerController,
    FetchPerfilController,
    UpdatePerfilController,
    DeleteUserController,
    DeleteCamadaController,
    RecoveryCamadaController,
    RecoveryUserController,
    UpdateCamadaController,
    UpdateAtributosCamadaController,
    ActivateCamadaController,
    CreateLogCamadaController,
    GetAcessosCamadaController,
    FavoriteContentController,
    CreatePacoteConceitualController,
    UpdatePacoteConceitualController,
    FetchCamadasPublicaveisController,
    DeletePacoteConceitualController,
    CreateTemaController,
    UpdateTemaController,
    DeleteTemaController,
    CreateGrupoCamadaController,
    UpdateGrupoController,
    DeleteGrupoController,
    MoverItensGrupoController,
    FetchConfigController,
    UpdateConfigController,
    SaveMapaController,
    UpdateMapaOwnerController,
    CreateLogMapaController,
    GetAcessosMapaController,
    DeleteMapaController,
    FetchContentOrganizationController,
    CreateCamadasRasterController,
    SessionMinioController,
    GetAcessosCamadaRasterController,
    UpdateCamadaRasterOwnerController,
    UpdateCamadaRasterController,
    DeleteCamadaRasterController,
    CreateLogCamadaRasterController,
    UploadRasterProgressController,
    GetCamadaRasterStatusController,
    GetCamadaStatusController,
    GetCamadaVetorialExistenteController,
    GetUserPerfilController,
    UpdateUserEmailController,
    UpdateUserPasswordController,
    FetchSicatCidadesController,
    FetchSicatBairrosController,
    FetchSicatLogradourosController,
    FetchSicatClientesController,
    FetchSicatImoveisController,
    GetSicatClienteByIdController,
    GetSicatImovelByMatriculaController,
    FetchSicatImovelByMatriculaController,
    FetchSicatHidrometrosImoveisController,
    FetchSicatHidrometrosByMatriculaController,
    FetchSicatImovelByCodigoHidrometroController,
    FetchSolicitacaoServicosController,
    GetSolicitacaoServicosByIdController,
    FetchSolicitacaoServicosByMatriculaController,
    FetchSolicitacaoServicosDetalhadaByRefAtendimentoController,
    FetchCroquiEnderecoByFiltrosController,
    FetchComponentesController,
    UpdateComponenteController,
    GetComponenteController,
    GetComponenteByNomeController,
    GetUserPreferencesController,
    CreateUserPreferencesController,
    UpdateUserPreferencesController,
    DeleteUserPreferencesController,
    FetchCarregamentoPadraoController,
    FetchSolicitacaoServicosByNumSsController,
    CreateBasemapController,
    FetchBasemapsController,
    GetBasemapController,
    UpdateBasemapController,
    DeleteBasemapController,
    CreatePitometriaController,
    UpdatePitometriaController,
    UpdatePitometriaGeometryController,
    DeletePitometriaController,
    FetchPitometriaController,
    GetPitometriaByIdController,
    FetchPitometriaDwController,
    FetchPitometriaDwSpatialController,
    FetchRelatorioUsoController,
    FetchRelatorioInventarioController,
    FetchRelatorioUsuariosController,
    RasterFilesTreeController,
    FetchGruposOverviewController,
    FetchUsuariosDisponiveisGrupoController,
    GetGrupoDetalheController,
    UpdateGrupoConfigController,
    GrupoMembrosController,
    GrupoParticipacaoController,
    GrupoItensController,
    RepublicarCamadaController,
  ],
  providers: [
    AuthenticateUserUseCase,
    AuthenticateEntraUserUseCase,
    EntraOidcService,
    RegisterUserUseCase,
    VerifyAccountUseCase,
    SavePasswordResetUseCase,
    GetUserEmailUseCase,
    ResetPasswordUseCase,
    GetPerfilUseCase,
    FetchCamadasUseCase,
    CreateCamadaUseCase,
    CreateFolderUseCase,
    FetchTemasUseCase,
    FetchGrupoUseCase,
    FetchGrupoTemasUseCase,
    FetchCamadasGrupoUseCase,
    FetchContentUserUseCase,
    FetchPacotesConceituaisUseCase,
    FetchNivelCompartilhamentoUseCase,
    FetchFolderContentUseCase,
    FetchFoldersUseCase,
    FetchCamadasFoldersUseCase,
    GetUserPerfilUseCase,
    GetUserUseCase,
    EditCamadaUseCase,
    FetchAtributosCamadasUseCase,
    UpdateFolderUseCase,
    AssociateFolderCamadaUseCase,
    DeleteFolderUseCase,
    DeleteCamadaFolderUseCase,
    FetchUsersUseCase,
    FetchUsersProfileUseCase,
    UpdateOwnerCamadaUseCase,
    RegisterLastLoginUseCase,
    FetchPerfilUseCase,
    UpdatePerfilUserUseCase,
    DeleteUserUseCase,
    DeleteCamadaUseCase,
    RecoveryCamadaUseCase,
    RecoveryUserUseCase,
    UpdateCamadaUseCase,
    UpdateAtributoUseCase,
    ActivateCamadaUseCase,
    DeactivateCamadaUseCase,
    RegisterLogCamadaUseCase,
    GetAcessosCamadaUseCase,
    RegisterCamadaFavoritaUseCase,
    DeleteCamadaFavoritaUseCase,
    CheckCamadaFavoritaUseCase,
    CreatePacoteConceitualUseCase,
    UpdatePacoteConceitualUseCase,
    CreateAtributosUseCase,
    DeletePacoteConceitualUseCase,
    CreateTemaUseCase,
    UpdateTemaUseCase,
    DeleteTemaUseCase,
    GetTemaUseCase,
    CreateGrupoUseCase,
    UpdateGrupoUseCase,
    DeleteGrupoUseCase,
    MoverItensGrupoUseCase,
    FetchConfigsUseCase,
    UpdateConfiglUseCase,
    CreateMapaUseCase,
    GetMapaNomeUseCase,
    UpdateMapaUseCase,
    DeleteCamadaMapaUseCase,
    AssociateMapaCamadaUseCase,
    CheckMapaFavoritoUseCase,
    RegisterMapaFavoritoUseCase,
    DeleteMapaFavoritoUseCase,
    AssociateFolderMapaUseCase,
    DeleteMapaFolderUseCase,
    FetchMapasFoldersUseCase,
    UpdateOwnerMapaUseCase,
    GetFolderMapaUseCase,
    GetFolderCamadaUseCase,
    RegisterLogMapaUseCase,
    GetAcessosMapaUseCase,
    DeleteMapaUseCase,
    FetchContentOrganizationUseCase,
    FetchMapasGrupoUseCase,
    CreateCamadaRasterUseCase,
    EditCamadaRasterUseCase,
    FetchCamadasRasterUseCase,
    UpdateCamadaRasterUseCase,
    CheckCamadaRasterFavoritaUseCase,
    GetAcessosCamadaUseCase,
    RegisterCamadaRasterFavoritaUseCase,
    DeleteCamadaRasterFavoritaUseCase,
    ActivateCamadaRasterUseCase,
    DeactivateCamadaRasterUseCase,
    AssociateFolderCamadaRasterUseCase,
    DeleteCamadaRasterFolderUseCase,
    FetchCamadasRasterFoldersUseCase,
    GetAcessosCamadaRasterUseCase,
    UpdateOwnerCamadaRasterUseCase,
    GetFolderCamadaRasterUseCase,
    DeleteCamadaRasterUseCase,
    RegisterLogCamadaRasterUseCase,
    AssociateMapaCamadaRasterUseCase,
    DeleteCamadaRasterMapaUseCase,
    GetOrdemCamadaUseCase,
    GetOrdemCamadaRasterUseCase,
    FetchCamadasRasterGrupoUseCase,
    GetCamadasRasterFonteUseCase,
    GetCamadasUseCase,
    GetPacotesConceituaisCamadasUseCase,
    UpdateEmailUserUseCase,
    UpdatePasswordUserUseCase,
    FetchSicatCidadesUseCase,
    FetchSicatBairrosUseCase,
    FetchSicatLogradourosUseCase,
    FetchSicatClientesUseCase,
    FetchSicatImoveisUseCase,
    GetSicatClienteByIdUseCase,
    GetSicatImovelByMatriculaUseCase,
    FetchSicatImovelByMatriculaUseCase,
    FetchSicatHidrometrosImoveisUseCase,
    FetchSicatHidrometrosByMatriculaUseCase,
    FetchSicatImovelByCodigoHidrometroUseCase,
    FetchSolicitacaoServicosUseCase,
    GetSolicitacaoServicosByIdUseCase,
    FetchSolicitacaoServicosByMatriculaUseCase,
    FetchSolicitacaoServicosDetalhadaByRefAtendimentoUseCase,
    FetchCroquiEnderecoByFiltrosUseCase,
    FetchComponentesUseCase,
    UpdateComponenteUseCase,
    GetComponenteUseCase,
    GetComponenteByNomeUseCase,
    GetPreferencesUseCase,
    CreatePreferencesUseCase,
    UpdatePreferencesUseCase,
    DeletePreferencesUseCase,
    FetchCarregamentoPadraoUseCase,
    FetchSolicitacaoServicosByNumSsUseCase,
    CreateBasemapUseCase,
    FetchBasemapsUseCase,
    GetBasemapUseCase,
    UpdateBasemapUseCase,
    DeleteBasemapUseCase,
    CreatePitometriaUseCase,
    UpdatePitometriaUseCase,
    UpdatePitometriaGeometryUseCase,
    DeletePitometriaUseCase,
    FetchPitometriaUseCase,
    GetPitometriaByIdUseCase,
    FetchPitometriaDwUseCase,
    FetchPitometriaDwSpatialUseCase,
    FetchRelatorioUsoUseCase,
    FetchRelatorioInventarioUseCase,
    FetchRelatorioUsuariosUseCase,
    ListRasterFilesUseCase,
    CheckRasterAlreadyPublishedUseCase,
    GrupoAccessPolicy,
    FetchGruposOverviewUseCase,
    FetchUsuariosDisponiveisUseCase,
    GetGrupoDetalheUseCase,
    UpdateGrupoConfigUseCase,
    AddGrupoMembroUseCase,
    RemoveGrupoMembroUseCase,
    SairGrupoUseCase,
    SolicitarParticipacaoGrupoUseCase,
    ResponderSolicitacaoGrupoUseCase,
    ParticiparGrupoUseCase,
    AddItemToGrupoUseCase,
    RepublicarCamadaUseCase,
    RepublicarCamadaRasterUseCase,
    ReconciliarAtributosService,
    {
      provide: ColunasTabelaProvider,
      useClass: PostgisColunasTabelaProvider,
    },
    {
      provide: GeoserverCamadaGateway,
      useClass: GeoserverCamadaGatewayImpl,
    },
    RepublicarCamadaRunner,
    RemoveItemFromGrupoUseCase,
    GetItensDisponiveisGrupoUseCase,
  ],
})
export class HttpModule {}
