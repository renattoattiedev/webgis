import { Controller, Param, Sse } from '@nestjs/common';
import { Observable, interval, switchMap, takeWhile, map, scan } from 'rxjs';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { Public } from '@/infra/auth/public';

interface ProgressEvent {
  data: { progress: number; status: string };
}

const MAX_PUBLISHING_POLLS = 120; // 2 minutes timeout for stuck publishing

@Controller('/upload-raster/progress')
export class UploadRasterProgressController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Sse(':camadaId')
  stream(@Param('camadaId') camadaId: string): Observable<ProgressEvent> {
    return interval(1000).pipe(
      switchMap(() =>
        this.prisma.camadasRaster.findUnique({
          where: { COD_CAMADA_RASTER_ID: camadaId },
          select: { DSC_STATUS: true, NUM_UPLOAD_PROGRESS: true },
        }),
      ),
      map((camada) => ({
        progress: camada?.NUM_UPLOAD_PROGRESS ?? 0,
        status: camada?.DSC_STATUS ?? 'uploading',
      })),
      // Track consecutive polls stuck in 'publishing'
      scan(
        (acc, curr) => ({
          ...curr,
          publishingCount:
            curr.status === 'publishing' ? acc.publishingCount + 1 : 0,
        }),
        { progress: 0, status: 'uploading', publishingCount: 0 },
      ),
      map((state) => ({
        data: {
          progress: state.progress,
          // Force error if stuck publishing for too long
          status:
            state.status === 'publishing' &&
            state.publishingCount >= MAX_PUBLISHING_POLLS
              ? 'error'
              : state.status,
        },
      })),
      takeWhile(
        (event) =>
          event.data.status !== 'published' && event.data.status !== 'error',
        true,
      ),
    );
  }
}
