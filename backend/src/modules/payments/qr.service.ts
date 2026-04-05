import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import * as QRCode from 'qrcode';

/**
 * Payload del QR simplificado: `transactionId:providerId:amount`
 * firmado con HMAC-SHA256 usando QR_HMAC_SECRET dedicado.
 *
 * La firma @unique en BD impide doble-cobro por reutilización del QR.
 */
export interface QrData {
  transactionId: string;
  providerId: string;
  amount: number; // remainingAmount (90%) en COP
}

@Injectable()
export class QrService {
  private readonly secretKey: string;

  constructor(private config: ConfigService) {
    this.secretKey = this.config.get<string>('QR_HMAC_SECRET', 'change-me-qr-secret');
  }

  /**
   * Genera firma HMAC-SHA256 del QR.
   * Payload canónico: `${transactionId}:${providerId}:${amount}`
   */
  generateSignedQR(transactionId: string, providerId: string, amount: number): {
    transactionId: string;
    amount: number;
    signature: string;
  } {
    const data = `${transactionId}:${providerId}:${amount}`;
    const signature = createHmac('sha256', this.secretKey)
      .update(data)
      .digest('hex');

    return { transactionId, amount, signature };
  }

  /**
   * Verifica la firma digital de un QR escaneado.
   * Reconstruye el payload canónico y compara con timing-safe.
   */
  verifySignature(transactionId: string, providerId: string, amount: number, signature: string): boolean {
    const data = `${transactionId}:${providerId}:${amount}`;
    const expectedSignature = createHmac('sha256', this.secretKey)
      .update(data)
      .digest('hex');

    // Comparación timing-safe para prevenir timing attacks
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const signatureBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== signatureBuf.length) return false;
    return timingSafeEqual(expectedBuf, signatureBuf);
  }

  /**
   * Genera imagen QR como Data URL (base64 PNG).
   * Contenido: JSON con { transactionId, amount, signature }
   */
  async generateQrImage(qrData: {
    transactionId: string;
    amount: number;
    signature: string;
  }): Promise<string> {
    const payload = JSON.stringify(qrData);
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      width: 400,
      margin: 2,
    });
  }
}
