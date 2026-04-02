import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UnregisterPushTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  token?: string;
}
