// FIRST, above every other import. OpenTelemetry instruments by patching
// modules as they load, so anything required before this line is never
// instrumented. This import used to sit at the bottom of the list, and the
// result was measurable: gpool's traces had express middleware spans but no
// `pg.query` and no controller spans, because `pg` and `@nestjs/core` had
// already loaded. Do not let a formatter or an import sorter move it.
import './observability/tracing';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as connectPgSimple from 'connect-pg-simple';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import * as passport from 'passport';
import { Pool } from 'pg';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { buildSessionPoolConfig, SESSION_TABLE_NAME } from './auth/session-store.config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { httpMetricsMiddleware, JsonLogger } from './observability';

const SWAGGER_PATH = '/docs';

type TrustProxy = boolean | number | 'loopback' | 'linklocal' | 'uniquelocal';

function parseCorsOrigins(raw: string | undefined): string[] {
  if (raw === undefined || raw === null || raw.trim() === '') {
    throw new Error('CORS_ORIGINS is required and must not be empty');
  }
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    throw new Error('CORS_ORIGINS is required and must contain at least one origin');
  }
  return origins;
}

function parseBooleanEnv(input: string | undefined, fallback: boolean): boolean {
  if (input === undefined || input === null || input.trim() === '') {
    return fallback;
  }

  const normalized = input.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  throw new Error('SWAGGER_ENABLED must be true/false (or 1/0, yes/no)');
}

function parseTrustProxy(input: string | undefined): TrustProxy {
  if (input === undefined || input === null || input.trim() === '') {
    return false;
  }

  const normalized = input.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  if (normalized === 'loopback' || normalized === 'linklocal' || normalized === 'uniquelocal') {
    return normalized;
  }
  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  throw new Error(
    'TRUST_PROXY must be one of: false, true, loopback, linklocal, uniquelocal, or a numeric hop count'
  );
}

async function bootstrap() {
  // `bufferLogs` holds the bootstrap lines until the logger is installed, so
  // startup logs come out as JSON with a traceId like everything else instead
  // of as Nest's coloured text.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(JsonLogger));
  const expressApp = app.getHttpAdapter().getInstance();

  const apiSecurityHeaders = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'none'"],
        'base-uri': ["'none'"],
        'form-action': ["'none'"],
        'frame-ancestors': ["'none'"],
      },
    },
  });

  const swaggerSecurityHeaders = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
        'base-uri': ["'none'"],
        'form-action': ["'none'"],
        'frame-ancestors': ["'none'"],
      },
    },
  });

  app.use((req: Request, res: Response, next: NextFunction) =>
    req.path === SWAGGER_PATH || req.path.startsWith(`${SWAGGER_PATH}/`)
      ? swaggerSecurityHeaders(req, res, next)
      : apiSecurityHeaders(req, res, next)
  );

  const configService = app.get(ConfigService);
  const PgSession = connectPgSimple(session);

  app.use(cookieParser(configService.get<string>('SESSION_COOKIE_SECRET')));
  app.use(
    session({
      store: new PgSession({
        pool: new Pool(buildSessionPoolConfig(configService)),
        tableName: SESSION_TABLE_NAME,
        createTableIfMissing: true,
      }),
      secret: configService.get<string>('SESSION_SECRET', ''),
      resave: false,
      saveUninitialized: false,
      name: configService.get<string>('SESSION_COOKIE_NAME', 'gpool.sid'),
      cookie: {
        maxAge: Number(configService.get<string>('SESSION_COOKIE_MAX_AGE_MS', '604800000')),
        sameSite: configService.get<string>('SESSION_COOKIE_SAME_SITE', 'lax') as
          boolean | 'lax' | 'strict' | 'none',
        httpOnly: true,
        secure: configService.get<string>('SESSION_COOKIE_SECURE') === 'true',
        domain: configService.get<string>('SESSION_COOKIE_DOMAIN') || undefined,
      },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  if (typeof expressApp?.set === 'function') {
    expressApp.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
  }
  app.use(httpMetricsMiddleware);

  app.enableCors({
    origin: parseCorsOrigins(process.env.CORS_ORIGINS),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const swaggerEnabled = parseBooleanEnv(process.env.SWAGGER_ENABLED, false);
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('GPool API')
      .setDescription('Monolithic backend API for gpool')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(SWAGGER_PATH.slice(1), app, document);
  }

  const port = Number(process.env.PORT || '3000');
  await app.listen(port);

  console.log(`gpool api listening on http://localhost:${port}`);
  if (swaggerEnabled) {
    console.log(`Swagger docs: http://localhost:${port}${SWAGGER_PATH}`);
  }
}

bootstrap();
