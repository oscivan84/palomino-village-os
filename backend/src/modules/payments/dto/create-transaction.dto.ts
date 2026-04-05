import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ description: 'ID del servicio a contratar' })
  @IsString()
  serviceId: string;

  @ApiProperty({ description: 'ID del proveedor del servicio' })
  @IsString()
  providerId: string;

  @ApiProperty({ description: 'Monto total en COP (Decimal)' })
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @ApiProperty({ description: 'Pasarela de pago a usar', required: false })
  @IsOptional()
  @IsString()
  gateway?: 'stripe' | 'dlocal' | 'bold';
}

export class GenerateQrDto {
  @ApiProperty({ description: 'ID de la transacción' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Latitud del técnico al completar servicio' })
  @IsNumber()
  providerLat: number;

  @ApiProperty({ description: 'Longitud del técnico al completar servicio' })
  @IsNumber()
  providerLng: number;
}

export class ScanQrDto {
  @ApiProperty({ description: 'ID de la transacción (del QR)' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Monto del QR' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Firma HMAC-SHA256 del QR' })
  @IsString()
  signature: string;

  @ApiProperty({ description: 'Latitud del cliente al escanear' })
  @IsNumber()
  clientLat: number;

  @ApiProperty({ description: 'Longitud del cliente al escanear' })
  @IsNumber()
  clientLng: number;
}
