import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  PublicacaoHistoricoRepository,
  RegistroPublicacao,
} from '@/domain/camadas/application/repositories/publicacao-historico-repository';

@Injectable()
export class PrismaPublicacaoHistoricoRepository
  implements PublicacaoHistoricoRepository
{
  constructor(private prisma: PrismaService) {}

  async registrar(registro: RegistroPublicacao): Promise<void> {
    const comum = {
      DSC_OPERACAO: registro.operacao,
      DSC_STATUS: registro.status,
      DSC_ERROR_MSG: registro.errorMsg ? registro.errorMsg.slice(0, 500) : null,
      TXT_MUDANCAS: registro.mudancas
        ? JSON.stringify(registro.mudancas)
        : null,
      COD_USUARIO: registro.usuarioId,
    };

    if (registro.tipo === 'camada') {
      await this.prisma.publicacaoCamada.create({
        data: { ...comum, COD_CAMADA_ID: registro.camadaId },
      });
      return;
    }

    await this.prisma.publicacaoCamadaRaster.create({
      data: { ...comum, COD_CAMADA_RASTER_ID: registro.camadaId },
    });
  }
}
