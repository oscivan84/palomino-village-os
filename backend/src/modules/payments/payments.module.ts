import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EscrowService } from './escrow.service';
import { QrService } from './qr.service';
import { GpsService } from './gps.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, EscrowService, QrService, GpsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
