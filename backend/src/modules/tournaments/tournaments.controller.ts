import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { TournamentsService } from './tournaments.service';
import { TournamentType } from '@prisma/client';

@ApiTags('Tournaments & ELO')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get('node/:nodeId')
  @ApiOperation({ summary: 'Listar torneos de un nodo' })
  async getTournaments(@Param('nodeId') nodeId: string) {
    return this.tournamentsService.getTournaments(nodeId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear torneo (billar, surf, servicios)' })
  async createTournament(@Body() body: any) {
    return this.tournamentsService.createTournament(body);
  }

  @Post(':id/register')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrarse en un torneo' })
  async register(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.id || 'demo-user';
    return this.tournamentsService.registerPlayer(id, userId);
  }

  @Post('matches/:matchId/result')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reportar resultado de match (actualiza ELO)' })
  async reportResult(
    @Param('matchId') matchId: string,
    @Body() body: { winnerId: string; score: { player1: number; player2: number } },
  ) {
    return this.tournamentsService.reportMatchResult(
      matchId,
      body.winnerId,
      body.score,
    );
  }

  @Get('leaderboard/:type')
  @ApiOperation({ summary: 'Ranking ELO por tipo (BILLIARDS, SURF, SERVICE_RATING)' })
  async leaderboard(@Param('type') type: TournamentType) {
    return this.tournamentsService.getLeaderboard(type);
  }
}
