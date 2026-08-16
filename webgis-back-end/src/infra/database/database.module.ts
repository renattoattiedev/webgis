import { ComponenteRepository } from '@/domain/manager/application/repositories/componente-repository';
import { PrismaComponenteRepository } from './prisma/repositories/prisma-componente-repository';
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { PrismaCamadasRepository } from './prisma/repositories/prisma-camadas-repository';
import { CamadasRepository } from '@/domain/camadas/application/repositories/camadas-repository';
import { UserRepository } from '@/domain/security/application/repositories/user-repository';
import { PrismaUserRepository } from './prisma/repositories/prisma-user-repository';
import { TemasRepository } from '@/domain/manager/application/repositories/temas-repository';
import { PrismaTemasRepository } from './prisma/repositories/prisma-temas-repository';
import { GrupoRepository } from '@/domain/manager/application/repositories/grupo-repository';
import { PrismaGrupoRepository } from './prisma/repositories/prisma-grupo-repository';
import { GrupoMembrosRepository } from '@/domain/manager/application/repositories/grupo-membros-repository';
import { PrismaGrupoMembrosRepository } from './prisma/repositories/prisma-grupo-membros-repository';
import { GrupoItensAdicionaisRepository } from '@/domain/manager/application/repositories/grupo-itens-adicionais-repository';
import { PrismaGrupoItensAdicionaisRepository } from './prisma/repositories/prisma-grupo-itens-adicionais-repository';
import { PacotesConceituaisRepository } from '@/domain/manager/application/repositories/pacotes-conceituais-repository';
import { PrismaPacotesConceituaisRepository } from './prisma/repositories/prisma-pacotes-conceituais-repository';
import { NivelCompartilhamentoRepository } from '@/domain/manager/application/repositories/nivel-compartilhamento-repository';
import { PrismaNivelCompartilhamentoRepository } from './prisma/repositories/prisma-nivel-compartilhamento-repository';
import { AtributosRepository } from '@/domain/camadas/application/repositories/atributo-repository';
import { PrismaAtributosRepository } from './prisma/repositories/prisma-atributos-repository';
import { FoldersRepository } from '@/domain/folder/application/repositories/foders-repository';
import { PrismaFoldersRepository } from './prisma/repositories/prisma-folders-repository';
import { PerfilRepository } from '@/domain/security/application/repositories/perfil-repository';
import { PrismaPerfilRepository } from './prisma/repositories/prisma-perfil-repository';
import { PrismaCamadasLogRepository } from './prisma/repositories/prisma-camadas-log-repository';
import { CamadasLogRepository } from '@/domain/camadas/application/repositories/camadas-logs-repository';
import { FavoritosCamadasRepository } from '@/domain/camadas/application/repositories/favoritos-camadas-reposistory';
import { PrismaFavoritosCamadasRepository } from './prisma/repositories/prisma-favoritos-camadas-repository';
import { ConfigRepository } from '@/domain/manager/application/repositories/config-repository';
import { PrismaConfigRepository } from './prisma/repositories/prisma-config-repository';
import { MapasRepository } from '@/domain/mapas/application/repositories/mapas-repository';
import { PrismaMapasRepository } from './prisma/repositories/prisma-mapas-repository';
import { ContentRepository } from '@/domain/manager/application/repositories/content-repository';
import { PrismaContentRepository } from './prisma/repositories/prisma-content-repository';
import { FavoritosMapasRepository } from '@/domain/mapas/application/repositories/favoritos-mapas-reposistory';
import { PrismaFavoritosMapasRepository } from './prisma/repositories/prisma-favoritos-mapas-repository';
import { MapasLogRepository } from '@/domain/mapas/application/repositories/mapas-logs-repository';
import { PrismaMapasLogRepository } from './prisma/repositories/prisma-mapas-log-repository';
import { CamadasRasterRepository } from '@/domain/camadas-raster/application/repositories/camadas-raster-repository';
import { PrismaCamadasRasterRepository } from './prisma/repositories/prisma-camadas-raster-repository';
import { CamadasRasterLogRepository } from '@/domain/camadas-raster/application/repositories/camadas-raster-logs-repository';
import { PrismaCamadasRasterLogRepository } from './prisma/repositories/prisma-camadas-raster-log-repository';
import { FavoritosCamadasRasterRepository } from '@/domain/camadas-raster/application/repositories/favoritos-camadas-raster-reposistory';
import { PrismaFavoritosCamadasRasterRepository } from './prisma/repositories/prisma-favoritos-camadas-raster-repository';
import { EnvModule } from '../env/env.module';
import { CroquiRepository } from '@/domain/croqui/application/repositories/croqui-endereco-repository';
import { PrismaCroquiEnderecoRepository } from './prisma/repositories/prisma-croqui-endereco-repository';
import { SicatRepository } from '@/domain/sicat/application/repositories/sicat-repository';
import { PrismaSicatRepository } from './prisma/repositories/prisma-sicat-repository';
import { SolicitacaoServicosRepository } from '@/domain/sicat/application/repositories/solicitacao-servicos-repository';
import { PrismaSolicitacaoServicosRepository } from './prisma/repositories/prisma-solicitacao-servicos-repository';
import { PreferencesRepository } from '@/domain/user/application/repositories/preferences-repository';
import { PrismaPreferencesUserRepository } from './prisma/repositories/prisma-preferences-user-repository';
import { BasemapsRepository } from '@/domain/basemaps/application/repositories/basemaps-repository';
import { PrismaBasemapRepository } from './prisma/repositories/prisma-basemap-repository';
import { PitometriaRepository } from '@/domain/pitometria/application/repositories/pitometria-repository';
import { PrismaPitometriaRepository } from './prisma/repositories/prisma-pitometria-repository';
import { PitometriaDwRepository } from '@/domain/pitometria-dw/application/repositories/pitometria-dw-repository';
import { MssqlPitometriaDwRepository } from './mssql/repositories/mssql-pitometria-dw-repository';
import { DwDatabaseModule } from './dw/dw-database.module';
import { RelatoriosRepository } from '@/domain/relatorios/application/repositories/relatorios-repository';
import { PrismaRelatoriosRepository } from './prisma/repositories/prisma-relatorios-repository';
import { PublicacaoHistoricoRepository } from '@/domain/camadas/application/repositories/publicacao-historico-repository';
import { PrismaPublicacaoHistoricoRepository } from './prisma/repositories/prisma-publicacao-historico-repository';

@Module({
  imports: [EnvModule, DwDatabaseModule],
  providers: [
    PrismaService,
    {
      provide: NivelCompartilhamentoRepository,
      useClass: PrismaNivelCompartilhamentoRepository,
    },
    {
      provide: TemasRepository,
      useClass: PrismaTemasRepository,
    },
    {
      provide: PacotesConceituaisRepository,
      useClass: PrismaPacotesConceituaisRepository,
    },
    {
      provide: GrupoRepository,
      useClass: PrismaGrupoRepository,
    },
    {
      provide: GrupoMembrosRepository,
      useClass: PrismaGrupoMembrosRepository,
    },
    {
      provide: GrupoItensAdicionaisRepository,
      useClass: PrismaGrupoItensAdicionaisRepository,
    },
    {
      provide: AtributosRepository,
      useClass: PrismaAtributosRepository,
    },
    {
      provide: PublicacaoHistoricoRepository,
      useClass: PrismaPublicacaoHistoricoRepository,
    },
    {
      provide: CamadasRepository,
      useClass: PrismaCamadasRepository,
    },
    {
      provide: CamadasRasterRepository,
      useClass: PrismaCamadasRasterRepository,
    },
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: PerfilRepository,
      useClass: PrismaPerfilRepository,
    },
    {
      provide: FoldersRepository,
      useClass: PrismaFoldersRepository,
    },
    {
      provide: CamadasLogRepository,
      useClass: PrismaCamadasLogRepository,
    },
    {
      provide: CamadasRasterLogRepository,
      useClass: PrismaCamadasRasterLogRepository,
    },
    {
      provide: FavoritosCamadasRepository,
      useClass: PrismaFavoritosCamadasRepository,
    },
    {
      provide: FavoritosCamadasRasterRepository,
      useClass: PrismaFavoritosCamadasRasterRepository,
    },
    {
      provide: ConfigRepository,
      useClass: PrismaConfigRepository,
    },
    {
      provide: MapasRepository,
      useClass: PrismaMapasRepository,
    },
    {
      provide: ContentRepository,
      useClass: PrismaContentRepository,
    },
    {
      provide: FavoritosMapasRepository,
      useClass: PrismaFavoritosMapasRepository,
    },
    {
      provide: MapasLogRepository,
      useClass: PrismaMapasLogRepository,
    },
    {
      provide: CroquiRepository,
      useClass: PrismaCroquiEnderecoRepository,
    },
    {
      provide: SicatRepository,
      useClass: PrismaSicatRepository,
    },
    {
      provide: SolicitacaoServicosRepository,
      useClass: PrismaSolicitacaoServicosRepository,
    },
    {
      provide: ComponenteRepository,
      useClass: PrismaComponenteRepository,
    },
    {
      provide: PreferencesRepository,
      useClass: PrismaPreferencesUserRepository,
    },
    {
      provide: BasemapsRepository,
      useClass: PrismaBasemapRepository,
    },
    {
      provide: PitometriaRepository,
      useClass: PrismaPitometriaRepository,
    },
    {
      provide: PitometriaDwRepository,
      useClass: MssqlPitometriaDwRepository,
    },
    {
      provide: RelatoriosRepository,
      useClass: PrismaRelatoriosRepository,
    },
  ],
  exports: [
    PrismaService,
    CamadasRepository,
    CamadasRasterRepository,
    UserRepository,
    PerfilRepository,
    TemasRepository,
    GrupoRepository,
    GrupoMembrosRepository,
    GrupoItensAdicionaisRepository,
    PacotesConceituaisRepository,
    NivelCompartilhamentoRepository,
    AtributosRepository,
    PublicacaoHistoricoRepository,
    FoldersRepository,
    CamadasLogRepository,
    CamadasRasterLogRepository,
    FavoritosCamadasRepository,
    FavoritosCamadasRasterRepository,
    ConfigRepository,
    MapasRepository,
    ContentRepository,
    FavoritosMapasRepository,
    MapasLogRepository,
    CroquiRepository,
    SicatRepository,
    SolicitacaoServicosRepository,
    ComponenteRepository,
    PreferencesRepository,
    BasemapsRepository,
    PitometriaRepository,
    PitometriaDwRepository,
    RelatoriosRepository,
  ],
})
export class DatabaseModule {}
