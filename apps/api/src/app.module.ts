import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { LifecycleService, ObservabilityModule } from './observability';
import { PoolModule } from './pool/pool.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    ObservabilityModule,
    PoolModule,
  ],
  providers: [LifecycleService],
})
export class AppModule {}
