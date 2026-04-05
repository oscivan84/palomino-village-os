import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { OtpService } from './otp.service';
import { createHmac } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;

  constructor(
    private prisma: PrismaService,
    private otpService: OtpService,
    private config: ConfigService,
  ) {
    this.jwtSecret = this.config.get<string>('JWT_SECRET', 'dev-secret');
  }

  /**
   * Paso 1 del login: enviar OTP al teléfono.
   * Si el usuario no existe, lo crea automáticamente.
   */
  async requestOtp(phone: string, channel: 'whatsapp' | 'sms' = 'whatsapp') {
    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          displayName: `User-${phone.slice(-4)}`,
          roles: ['TOURIST'],
        },
      });
      this.logger.log(`New user created: ${user.id} (${phone})`);
    }

    const code = await this.otpService.generateOtp(user.id, channel);
    await this.otpService.sendOtp(phone, code, channel);

    return { message: 'OTP enviado', userId: user.id, channel };
  }

  /**
   * Paso 2 del login: verificar OTP y devolver token de sesión.
   */
  async verifyOtp(phone: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    const isValid = await this.otpService.verifyOtp(user.id, code);
    if (!isValid) throw new UnauthorizedException('Código OTP inválido o expirado');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date(), isVerified: true },
    });

    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        displayName: user.displayName,
        roles: user.roles,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
    };
  }

  /**
   * Genera un token simple basado en HMAC.
   * En producción, migrar a JWT con @nestjs/jwt.
   */
  private generateToken(userId: string): string {
    const payload = JSON.stringify({
      userId,
      iat: Date.now(),
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 días
    });
    const signature = createHmac('sha256', this.jwtSecret)
      .update(payload)
      .digest('hex');
    const token = Buffer.from(payload).toString('base64') + '.' + signature;
    return token;
  }

  /**
   * Verifica un token y retorna el userId.
   */
  verifyToken(token: string): string | null {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const payload = Buffer.from(payloadB64, 'base64').toString();
    const expectedSig = createHmac('sha256', this.jwtSecret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSig) return null;

    const data = JSON.parse(payload);
    if (data.exp < Date.now()) return null;

    return data.userId;
  }
}
