import { Public } from '@/infra/auth/public';
import { GeoserverAPI } from '@/infra/modulos_ext/geoserver/geoserver-api';
import { Controller, Get, HttpCode, Param, Req } from '@nestjs/common';

@Controller('/get-camadas-extent/:pacoteConceitual/:nomCamada')
export class ExtentCamadaController {
  constructor(private readonly geoserverAPI: GeoserverAPI) {}

  @Get()
  @HttpCode(201)
  @Public()
  async handle(
    @Req() request: Request,
    @Param('pacoteConceitual') pacoteConceitual: string,
    @Param('nomCamada') nomCamada: string,
  ) {
    const data = await this.geoserverAPI.getExtentCamadas(
      pacoteConceitual,
      nomCamada,
    );
    if (data) {
      const latLonBoundingBox = data.featureType.latLonBoundingBox;
      return latLonBoundingBox;
    } else {
      throw new Error('Empty response or no data received.');
    }
  }
}
