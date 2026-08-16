import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConfigRepository } from '@/domain/manager/application/repositories/config-repository';
import { PrismaConfigMapper } from '../mappers/prisma-config-mapper';
import { Config } from '@/domain/manager/enterprise/entities/config';

@Injectable()
export class PrismaConfigRepository implements ConfigRepository {
  constructor(private prisma: PrismaService) {}

  async findManyKeys(): Promise<Config[]> {
    const configs = await this.prisma.config.findMany();

    return configs.map(PrismaConfigMapper.toDomain);
  }

  async findById(COD_CONFIG_ID: string): Promise<Config | null> {
    const config = await this.prisma.config.findUnique({
      where: {
        COD_CONFIG_ID,
        DHS_EXCLUSAO: null,
      },
    });

    if (!config) {
      return null;
    }

    return PrismaConfigMapper.toDomain(config);
  }

  async findKey(DSC_KEY: string): Promise<Config | null> {
    const config = await this.prisma.config.findFirst({
      where: {
        DSC_KEY,
        DHS_EXCLUSAO: null,
      },
    });

    if (!config) {
      return null;
    }

    return PrismaConfigMapper.toDomain(config);
  }

  async save(config: Config): Promise<void> {
    const data = PrismaConfigMapper.toPrisma(config);

    await Promise.all([
      this.prisma.config.update({
        where: {
          COD_CONFIG_ID: config.id.toString(),
        },
        data,
      }),
    ]);
  }
}
