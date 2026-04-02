import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushService } from './push.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UnregisterPushTokenDto } from './dto/unregister-push-token.dto';

@Controller('notifications/push')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly pushService: PushService) {}

  @Post('register')
  async registerToken(@Request() req, @Body() dto: RegisterPushTokenDto) {
    return this.pushService.registerToken(req.user.sub, dto);
  }

  @Post('unregister')
  async unregisterToken(@Request() req, @Body() dto: UnregisterPushTokenDto) {
    return this.pushService.unregisterToken(req.user.sub, dto.token);
  }
}
