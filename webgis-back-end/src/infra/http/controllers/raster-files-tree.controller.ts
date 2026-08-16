import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ListRasterFilesUseCase } from '@/domain/raster-files/application/use-cases/list-raster-files';
import { CheckRasterAlreadyPublishedUseCase } from '@/domain/raster-files/application/use-cases/check-raster-already-published';

@Controller('/raster-files')
export class RasterFilesTreeController {
  constructor(
    private readonly listUseCase: ListRasterFilesUseCase,
    private readonly checkUseCase: CheckRasterAlreadyPublishedUseCase,
  ) {}

  @Get('/tree')
  async tree(@Query('path') p?: string) {
    const relativePath = (p ?? '').trim();
    const result = await this.listUseCase.execute({ relativePath });
    if (result.isLeft()) {
      throw new BadRequestException(result.value);
    }
    return result.value;
  }

  @Get('/check')
  async check(@Query('path') p?: string) {
    const relativePath = (p ?? '').trim();
    if (!relativePath) throw new BadRequestException('path obrigatório');
    const result = await this.checkUseCase.execute({ relativePath });
    if (result.isLeft()) {
      throw new BadRequestException(result.value);
    }
    return result.value;
  }
}
