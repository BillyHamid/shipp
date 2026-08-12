import { Module } from '@nestjs/common'
import { NotificationsController } from './notifications.controller.js'
import { NotificationLinksService } from './notification-links.service.js'
import { AqilasSmsService } from './aqilas-sms.service.js'

@Module({
  controllers: [NotificationsController],
  providers: [NotificationLinksService, AqilasSmsService],
})
export class NotificationsModule {}
