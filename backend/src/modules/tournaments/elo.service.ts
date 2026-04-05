import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TournamentType } from '@prisma/client';

@Injectable()
export class EloService {
  private readonly K_FACTOR = 32; // Factor K estándar para ELO

  constructor(private prisma: PrismaService) {}

  /**
   * Calcula el nuevo rating ELO tras un match.
   *
   * Fórmula estándar:
   * E_a = 1 / (1 + 10^((R_b - R_a) / 400))
   * R_a_new = R_a + K * (S_a - E_a)
   *
   * Donde S_a = 1 (victoria), 0 (derrota), 0.5 (empate)
   */
  calculateNewRatings(
    ratingA: number,
    ratingB: number,
    scoreA: number, // 1 = win, 0 = loss, 0.5 = draw
  ): { newRatingA: number; newRatingB: number } {
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 - expectedA;

    const newRatingA = Math.round(ratingA + this.K_FACTOR * (scoreA - expectedA));
    const newRatingB = Math.round(
      ratingB + this.K_FACTOR * (1 - scoreA - expectedB),
    );

    return { newRatingA, newRatingB };
  }

  /**
   * Actualiza los scores ELO de ambos jugadores tras un match.
   */
  async updateElo(
    winnerId: string,
    loserId: string,
    type: TournamentType,
  ): Promise<{
    winner: { oldScore: number; newScore: number };
    loser: { oldScore: number; newScore: number };
  }> {
    const [winnerElo, loserElo] = await Promise.all([
      this.getOrCreateElo(winnerId, type),
      this.getOrCreateElo(loserId, type),
    ]);

    const { newRatingA, newRatingB } = this.calculateNewRatings(
      winnerElo.score,
      loserElo.score,
      1, // winner gets score 1
    );

    await Promise.all([
      // Actualizar EloScore por tipo de torneo
      this.prisma.eloScore.update({
        where: { id: winnerElo.id },
        data: {
          score: newRatingA,
          wins: { increment: 1 },
          streak: winnerElo.streak >= 0 ? winnerElo.streak + 1 : 1,
          peakScore: Math.max(winnerElo.peakScore, newRatingA),
        },
      }),
      this.prisma.eloScore.update({
        where: { id: loserElo.id },
        data: {
          score: newRatingB,
          losses: { increment: 1 },
          streak: loserElo.streak <= 0 ? loserElo.streak - 1 : -1,
        },
      }),
      // Sincronizar User.elo global (mayor score entre todos los tipos)
      this.syncGlobalElo(winnerId),
      this.syncGlobalElo(loserId),
    ]);

    return {
      winner: { oldScore: winnerElo.score, newScore: newRatingA },
      loser: { oldScore: loserElo.score, newScore: newRatingB },
    };
  }

  async getLeaderboard(type: TournamentType, limit = 50) {
    return this.prisma.eloScore.findMany({
      where: { type },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true, isVerified: true },
        },
      },
    });
  }

  /**
   * Sincroniza User.elo con el mayor score entre todos los tipos de torneo.
   * User.elo es un snapshot rápido para consultas sin JOIN.
   */
  private async syncGlobalElo(userId: string) {
    const allScores = await this.prisma.eloScore.findMany({
      where: { userId },
      select: { score: true },
    });
    const maxScore = Math.max(1200, ...allScores.map((s) => s.score));
    await this.prisma.user.update({
      where: { id: userId },
      data: { elo: maxScore },
    });
  }

  private async getOrCreateElo(userId: string, type: TournamentType) {
    const existing = await this.prisma.eloScore.findUnique({
      where: { userId_type: { userId, type } },
    });

    if (existing) return existing;

    return this.prisma.eloScore.create({
      data: { userId, type, score: 1200 },
    });
  }
}
