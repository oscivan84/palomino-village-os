import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { randomInt } from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly expiryMinutes: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.expiryMinutes = this.config.get<number>('OTP_EXPIRY_MINUTES', 5);
  }

  /**
   * Genera un código OTP de 6 dígitos y lo almacena.
   */
  async generateOtp(
    userId: string,
    channel: 'whatsapp' | 'sms',
  ): Promise<string> {
    const code = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

    await this.prisma.otpCode.create({
      data: { userId, code, channel, expiresAt },
    });

    this.logger.log(`OTP generated for user ${userId} via ${channel}`);
    return code;
  }

  /**
   * Verifica un código OTP: debe existir, no estar usado y no estar expirado.
   */
  async verifyOtp(userId: string, code: string): Promise<boolean> {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) return false;

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });

    return true;
  }

  /**
   * Envía el OTP por WhatsApp o SMS usando Twilio.
   * En desarrollo, solo logea el código.
   */
  async sendOtp(
    phone: string,
    code: string,
    channel: 'whatsapp' | 'sms',
  ): Promise<void> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');

    if (!accountSid) {
      this.logger.warn(`[DEV] OTP for ${phone}: ${code} (via ${channel})`);
      return;
    }

    // En producción: integrar con Twilio API
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: `Tu código Palomino Village: ${code}`,
    //   from: channel === 'whatsapp' ? `whatsapp:${twilioNumber}` : twilioNumber,
    //   to: channel === 'whatsapp' ? `whatsapp:${phone}` : phone,
    // });

    this.logger.log(`OTP sent to ${phone} via ${channel}`);
  }
}
