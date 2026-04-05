import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { EloService } from './elo.service';

@Module({
  controllers: [TournamentsController],
  providers: [TournamentsService, EloService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
