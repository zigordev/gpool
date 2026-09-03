import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { HealthController } from './health.controller';

@Module({
  // Imported so health can report Kafka reachability alongside the database.
  imports: [NotificationModule],
  controllers: [HealthController],
})
export class HealthModule {}
