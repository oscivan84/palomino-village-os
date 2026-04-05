import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { EloService } from './elo.service';
import { TournamentStatus, TournamentType } from '@prisma/client';

@Injectable()
export class TournamentsService {
  constructor(
    private prisma: PrismaService,
    private elo: EloService,
  ) {}

  async createTournament(data: {
    nodeId: string;
    name: string;
    type: TournamentType;
    description?: string;
    maxPlayers?: number;
    entryFee?: number;
    startsAt: Date;
  }) {
    return this.prisma.tournament.create({ data });
  }

  async registerPlayer(tournamentId: string, userId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { _count: { select: { entries: true } } },
    });

    if (!tournament) throw new NotFoundException('Torneo no encontrado');
    if (tournament.status !== TournamentStatus.REGISTRATION) {
      throw new BadRequestException('El registro está cerrado');
    }
    if (tournament._count.entries >= tournament.maxPlayers) {
      throw new BadRequestException('Torneo lleno');
    }

    return this.prisma.tournamentEntry.create({
      data: { tournamentId, userId },
    });
  }

  async reportMatchResult(
    matchId: string,
    winnerId: string,
    score: { player1: number; player2: number },
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true },
    });

    if (!match) throw new NotFoundException('Match no encontrado');

    const loserId =
      winnerId === match.player1Id ? match.player2Id : match.player1Id;

    // Actualizar match
    await this.prisma.match.update({
      where: { id: matchId },
      data: { winnerId, score, playedAt: new Date() },
    });

    // Actualizar ELO
    const eloUpdate = await this.elo.updateElo(
      winnerId,
      loserId,
      match.tournament.type,
    );

    return { match: { winnerId, score }, elo: eloUpdate };
  }

  async getLeaderboard(type: TournamentType) {
    return this.elo.getLeaderboard(type);
  }

  async getTournaments(nodeId: string) {
    return this.prisma.tournament.findMany({
      where: { nodeId },
      orderBy: { startsAt: 'desc' },
      include: { _count: { select: { entries: true } } },
    });
  }
}
