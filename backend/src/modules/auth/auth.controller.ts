import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IsString, IsOptional, IsPhoneNumber } from 'class-validator';

class RequestOtpDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  channel?: 'whatsapp' | 'sms';
}

class VerifyOtpDto {
  @IsString()
  phone: string;

  @IsString()
  code: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @ApiOperation({
    summary: 'Solicitar OTP vía WhatsApp o SMS (login sin contraseña)',
  })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone, dto.channel);
  }

  @Post('otp/verify')
  @ApiOperation({
    summary: 'Verificar código OTP y obtener token de sesión',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }
}
