import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { EscrowService } from './escrow.service';
import { QrService } from './qr.service';
import { GpsService } from './gps.service';
import { CreateTransactionDto, ScanQrDto, GenerateQrDto } from './dto/create-transaction.dto';
import { TransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private escrow: EscrowService,
    private qr: QrService,
    private gps: GpsService,
  ) {}

  /**
   * PASO 1: Cliente solicita servicio → Crear transacción + cobrar reserva del 10%.
   *
   * Flujo:
   * 1. Calcular split: 10% reservación + 90% saldo pendiente
   * 2. Crear Payment Intent en Stripe (capture del 10%)
   * 3. Registrar transacción con status PENDING_RESERVATION
   */
  async createTransaction(clientId: string, dto: CreateTransactionDto) {
    const service = await this.prisma.serviceListing.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) throw new NotFoundException('Servicio no encontrado');
    if (!service.isAvailable) throw new BadRequestException('Servicio no disponible');
    if (service.providerId === clientId) {
      throw new BadRequestException('No puedes contratar tu propio servicio');
    }

    // Split 10/90
    const totalAmount = new Decimal(dto.totalAmount);
    const reservationAmount = totalAmount.mul(0.1).toDecimalPlaces(0); // 10%
    const remainingAmount = totalAmount.sub(reservationAmount);         // 90%

    const { clientSecret, paymentIntentId } =
      await this.escrow.createPaymentIntent(
        reservationAmount.toNumber(),
        'cop',
        {
          clientId,
          providerId: dto.providerId,
          serviceId: dto.serviceId,
          type: 'reservation',
        },
      );

    const transaction = await this.prisma.transaction.create({
      data: {
        clientId,
        providerId: dto.providerId,
        serviceId: dto.serviceId,
        status: TransactionStatus.PENDING_RESERVATION,
        totalAmount,
        reservationAmount,
        remainingAmount,
        gatewayProvider: dto.gateway || 'stripe',
        gatewayPaymentId: paymentIntentId,
      },
      include: {
        service: { select: { title: true } },
        provider: { select: { displayName: true } },
      },
    });

    this.logger.log(
      `Transaction ${transaction.id}: $${totalAmount} COP ` +
      `(reserva: $${reservationAmount}, saldo: $${remainingAmount})`,
    );

    return {
      transaction,
      clientSecret,
      split: {
        totalAmount: totalAmount.toNumber(),
        reservationAmount: reservationAmount.toNumber(),
        remainingAmount: remainingAmount.toNumber(),
      },
    };
  }

  /**
   * Webhook confirma pago del 10% → Status pasa a RESERVED.
   * (llamado internamente desde handleStripeWebhook)
   */
  async confirmReservation(transactionId: string) {
    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.RESERVED },
    });
  }

  /**
   * PASO 2: Técnico genera QR firmado al completar el servicio.
   *
   * QR contiene: `transactionId:providerId:remainingAmount`
   * firmado con HMAC-SHA256 usando QR_HMAC_SECRET.
   *
   * La firma se guarda como @unique en BD → impide doble-cobro.
   */
  async generateQr(providerId: string, dto: GenerateQrDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
      include: {
        service: { select: { title: true } },
        client: { select: { displayName: true } },
      },
    });

    if (!transaction) throw new NotFoundException('Transacción no encontrada');
    if (transaction.providerId !== providerId) {
      throw new ForbiddenException('Solo el proveedor puede generar el QR');
    }
    if (transaction.status !== TransactionStatus.RESERVED) {
      throw new BadRequestException(
        `Estado inválido para generar QR: ${transaction.status}. ` +
        'La reserva del 10% debe estar confirmada.',
      );
    }

    const remainingAmount = transaction.remainingAmount.toNumber();
    const signedQr = this.qr.generateSignedQR(
      transaction.id,
      providerId,
      remainingAmount,
    );

    // qrSignature @unique → si ya existe, es doble-cobro
    try {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.QR_GENERATED,
          qrSignature: signedQr.signature,
          qrPayload: `${transaction.id}:${providerId}:${remainingAmount}`,
          qrGeneratedAt: new Date(),
          serviceLat: dto.providerLat,
          serviceLng: dto.providerLng,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Este QR ya fue generado. No se puede reutilizar la misma firma.',
        );
      }
      throw error;
    }

    const qrImage = await this.qr.generateQrImage(signedQr);

    this.logger.log(`QR generated for tx ${transaction.id}: $${remainingAmount} COP`);

    return {
      qrImage,
      transactionId: transaction.id,
      amount: remainingAmount,
      signature: signedQr.signature,
    };
  }

  /**
   * PASO 3: Cliente escanea QR → Verificar firma + GPS → Cobrar saldo (90%).
   *
   * Validaciones:
   * 1. Verificar firma HMAC-SHA256 (integridad, anti-tampering)
   * 2. Verificar proximidad GPS (técnico y cliente a ≤100m)
   * 3. Si OK → cobrar remainingAmount (90%) y liberar fondos
   * 4. qrSignature @unique en BD → si ya fue usado, Prisma rechaza
   */
  async scanQrAndReleaseFunds(clientId: string, dto: ScanQrDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
    });

    if (!transaction) throw new NotFoundException('Transacción no encontrada');
    if (transaction.clientId !== clientId) {
      throw new ForbiddenException('Esta transacción no es tuya');
    }
    if (transaction.status !== TransactionStatus.QR_GENERATED) {
      throw new BadRequestException(
        `Estado inválido para escanear QR: ${transaction.status}`,
      );
    }

    // 1. Verificar firma HMAC
    const isValidSignature = this.qr.verifySignature(
      transaction.id,
      transaction.providerId,
      dto.amount,
      dto.signature,
    );
    if (!isValidSignature) {
      throw new BadRequestException('QR inválido: firma HMAC no verificada');
    }

    // 2. Verificar proximidad GPS (≤100 metros)
    if (!transaction.serviceLat || !transaction.serviceLng) {
      throw new BadRequestException('GPS del técnico no registrado');
    }

    const gpsCheck = this.gps.verifyProximity(
      transaction.serviceLat,
      transaction.serviceLng,
      dto.clientLat,
      dto.clientLng,
    );

    if (!gpsCheck.isValid) {
      throw new BadRequestException(
        `GPS no verificado: distancia ${gpsCheck.distanceMeters}m (máx: 100m). ` +
        'Ambos deben estar en el mismo lugar para confirmar.',
      );
    }

    // 3. Cobrar el saldo (90%) vía pasarela
    const remainingAmount = transaction.remainingAmount.toNumber();
    await this.escrow.releaseFunds(
      transaction.gatewayPaymentId!,
      remainingAmount,
    );

    // 4. Marcar como completada
    const completed = await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.COMPLETED,
        qrScannedAt: new Date(),
        clientLat: dto.clientLat,
        clientLng: dto.clientLng,
        gpsVerified: true,
        gpsDistanceMeters: gpsCheck.distanceMeters,
        escrowReleaseAt: new Date(),
        completedAt: new Date(),
      },
      include: {
        service: { select: { title: true } },
        provider: { select: { displayName: true } },
      },
    });

    this.logger.log(
      `Tx ${transaction.id} COMPLETED — GPS: ${gpsCheck.distanceMeters}m, ` +
      `saldo liberado: $${remainingAmount} COP`,
    );

    return {
      transaction: completed,
      gpsVerification: gpsCheck,
      fundsReleased: remainingAmount,
    };
  }

  /**
   * Procesa webhooks de Stripe.
   * payment_intent.succeeded → PENDING_RESERVATION → RESERVED
   */
  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const event = await this.escrow.handleWebhook(rawBody, signature);
    if (!event) return { received: true };

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as { id: string; metadata: Record<string, string> };
        this.logger.log(`Reservation payment confirmed: ${pi.id}`);

        // Buscar transacción por gatewayPaymentId y avanzar a RESERVED
        const tx = await this.prisma.transaction.findFirst({
          where: { gatewayPaymentId: pi.id },
        });
        if (tx) {
          await this.confirmReservation(tx.id);
          this.logger.log(`Tx ${tx.id} → RESERVED`);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as { id: string };
        this.logger.warn(`Reservation payment failed: ${pi.id}`);
        // No cancelamos automáticamente — puede reintentar
        break;
      }
    }

    return { received: true, type: event.type };
  }

  async getTransaction(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, displayName: true, avatarUrl: true } },
        provider: { select: { id: true, displayName: true, avatarUrl: true } },
        service: { select: { id: true, title: true, basePrice: true } },
      },
    });
  }

  async getUserTransactions(userId: string, role: 'client' | 'provider') {
    const where =
      role === 'client' ? { clientId: userId } : { providerId: userId };

    return this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { displayName: true, avatarUrl: true } },
        provider: { select: { displayName: true, avatarUrl: true } },
        service: { select: { title: true } },
      },
    });
  }
}
