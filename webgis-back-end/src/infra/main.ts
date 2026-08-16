import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './database/prisma/prisma.service';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Garante que onModuleDestroy() (ex: PrismaService.$disconnect()) rode em
    // SIGTERM/SIGINT, para não deixar conexões com o banco penduradas quando
    // o processo é parado normalmente (docker stop, Ctrl+C, rolling update).
    app.enableShutdownHooks();

    const port = process.env.PORT || 3000;

    const allowedOrigins = [
      'http://localhost:4200',
      'http://localhost:4201',
      'http://127.0.0.1:4201',
      'http://localhost:5173',
    ];

    // Em desenvolvimento, aceita origins de dev/túnel (ex.: trycloudflare.com) e
    // localhost — sem precisar listar cada host temporário. (Restringir em produção.)
    const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

    console.log('🌐 CORS configured (dev=%s)', isDev);

    app.enableCors({
      origin: function (origin, callback) {
        console.log('🔍 Request from origin:', origin);

        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          console.log('✅ Origin allowed:', origin);
          return callback(null, true);
        }

        // Em desenvolvimento, aceita qualquer origem (testes, túnel, LAN).
        if (isDev) {
          return callback(null, true);
        }

        console.log('❌ Origin blocked:', origin);
        return callback(new Error('Not allowed by CORS'), false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'Access-Control-Allow-Origin',
      ],
      credentials: true,
      optionsSuccessStatus: 200,
    });

    // Mark rasters stuck in 'publishing' as 'error' (interrupted by previous crash)
    const prisma = app.get(PrismaService);
    const stuck = await prisma.camadasRaster.updateMany({
      where: { DSC_STATUS: 'publishing' },
      data: { DSC_STATUS: 'error' },
    });
    if (stuck.count > 0) {
      console.warn(
        `⚠️  ${stuck.count} raster(s) stuck in 'publishing' → marked as 'error'`,
      );
    }

    await app.listen(port);
    console.log(`✅ Application running on port ${port}`);
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

bootstrap();
