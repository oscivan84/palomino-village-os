import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);
  private stripe: Stripe;

  constructor(private config: ConfigService) {
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    }
  }

  /**
   * Calcula el split 10/90:
   * - reservationAmount: 10% retenido como reserva/escrow
   * - remainingAmount: 90% pagado al confirmar vía QR
   */
  calculateSplit(totalAmount: number): {
    reservationAmount: number;
    remainingAmount: number;
    platformFee: number;
  } {
    const reservationAmount = Math.round(totalAmount * 0.1);
    const platformFee = 0;
    const remainingAmount = totalAmount - reservationAmount - platformFee;

    return { reservationAmount, remainingAmount, platformFee };
  }

  /**
   * Crea un Payment Intent en Stripe para el monto de reserva (10%).
   *
   * Flujo del split payment:
   * 1. Cliente paga reserva del 10% → PENDING_RESERVATION → RESERVED
   * 2. Técnico realiza servicio y genera QR firmado
   * 3. Cliente escanea QR + GPS → se cobra el 90% restante
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'cop',
    metadata: Record<string, string> = {},
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (!this.stripe) {
      this.logger.warn('Stripe not configured — returning mock payment');
      return {
        clientSecret: `mock_secret_${Date.now()}`,
        paymentIntentId: `mock_pi_${Date.now()}`,
      };
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        ...metadata,
        platform: 'palomino_village_os',
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Cobra el saldo restante (90%) tras verificación QR + GPS.
   * En producción: crear nuevo Payment Intent o usar Transfer a Connected Account.
   */
  async releaseFunds(
    originalPaymentId: string,
    remainingAmount: number,
    providerStripeAccountId?: string,
  ): Promise<void> {
    if (!this.stripe) {
      this.logger.warn('Stripe not configured — mock fund release');
      return;
    }

    // Crear nuevo pago por el saldo restante (90%)
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: remainingAmount,
      currency: 'cop',
      metadata: {
        platform: 'palomino_village_os',
        type: 'remaining_payment',
        originalPayment: originalPaymentId,
      },
      confirm: true,
      // En producción: transfer_data para Connected Accounts
      ...(providerStripeAccountId && {
        transfer_data: {
          destination: providerStripeAccountId,
        },
      }),
    });

    this.logger.log(
      `Remaining funds charged: $${remainingAmount} COP → PI ${paymentIntent.id}`,
    );
  }

  /**
   * Procesa webhook de Stripe para confirmar eventos de pago.
   */
  async handleWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<Stripe.Event | null> {
    if (!this.stripe) return null;

    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) return null;

    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  }
}
