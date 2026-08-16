import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ConfigService {
  private prisma = new PrismaClient();

  async getConfig(key: string): Promise<string | null> {
    try {
      const config = await this.prisma.config.findUnique({
        where: { DSC_KEY: key },
      });
      return config ? config.DSC_VALUE : null;
    } catch (error) {
      console.error(`Error fetching config for key ${key}:`, error);
      return null;
    }
  }
}
