import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailQueueService } from './email-queue.service';
import { EmailTemplateService } from './email-template.service';
import { PushService } from './push.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, EmailQueueService, EmailTemplateService, PushService],
  exports: [EmailService, EmailQueueService, EmailTemplateService, PushService],
})
export class NotificationsModule {}
