import { Controller, Get } from '@nestjs/common';
import { Public } from '@/infra/auth/public';
import { PrismaService } from '@/infra/database/prisma/prisma.service';

@Controller('/indicadores')
export class FetchIndicadoresController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Public()
  async handle() {
    const [temas, grupos, camadasVetoriais, camadasRaster, mapas, usuarios] =
      await Promise.all([
        this.prisma.temas.count({ where: { DHS_EXCLUSAO: null } }),
        this.prisma.grupo.count({ where: { DHS_EXCLUSAO: null } }),
        this.prisma.camadas.count({ where: { DHS_EXCLUSAO: null } }),
        this.prisma.camadasRaster.count({ where: { DHS_EXCLUSAO: null } }),
        this.prisma.mapas.count({ where: { DHS_EXCLUSAO: null } }),
        this.prisma.user.count({ where: { DHS_EXCLUSAO: null } }),
      ]);

    return {
      temas,
      grupos,
      camadasVetoriais,
      camadasRaster,
      mapas,
      usuarios,
    };
  }
}
