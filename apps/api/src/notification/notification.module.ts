import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationPublisherService } from './notification.publisher.service';

@Module({
  providers: [NotificationPublisherService, NotificationService],
  // Exported so the health endpoint can report broker reachability.
  exports: [NotificationService, NotificationPublisherService],
})
export class NotificationModule {}
