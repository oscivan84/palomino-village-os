import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreateTransactionDto, ScanQrDto, GenerateQrDto } from './dto/create-transaction.dto';

@ApiTags('Payments & Escrow')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('transactions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear transacción con split payment y escrow del 10%',
  })
  async createTransaction(
    @Body() dto: CreateTransactionDto,
    @Req() req: Request,
  ) {
    const clientId = (req as any).user?.id || 'demo-client'; // TODO: real auth
    return this.paymentsService.createTransaction(clientId, dto);
  }

  @Post('qr/generate')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Técnico genera QR dinámico firmado al completar servicio',
  })
  async generateQr(@Body() dto: GenerateQrDto, @Req() req: Request) {
    const providerId = (req as any).user?.id || 'demo-provider';
    return this.paymentsService.generateQr(providerId, dto);
  }

  @Post('qr/scan')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cliente escanea QR → verifica firma + GPS → libera fondos',
  })
  async scanQr(@Body() dto: ScanQrDto, @Req() req: Request) {
    const clientId = (req as any).user?.id || 'demo-client';
    return this.paymentsService.scanQrAndReleaseFunds(clientId, dto);
  }

  @Get('transactions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de una transacción' })
  async getTransaction(@Param('id') id: string) {
    return this.paymentsService.getTransaction(id);
  }

  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar transacciones del usuario' })
  async listTransactions(
    @Req() req: Request,
    @Query('role') role: 'client' | 'provider' = 'client',
  ) {
    const userId = (req as any).user?.id || 'demo-user';
    return this.paymentsService.getUserTransactions(userId, role);
  }

  @Post('webhooks/stripe')
  @ApiOperation({ summary: 'Webhook endpoint para Stripe' })
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleStripeWebhook(req.rawBody!, signature);
  }
}
