import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        nodes: { include: { node: true } },
        eloScores: true,
        achievements: { include: { achievement: true } },
        _count: {
          select: {
            sentTransactions: true,
            receivedTransactions: true,
            receivedReviews: true,
            posts: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; bio?: string; avatarUrl?: string; preferredLang?: string },
  ) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async joinNode(userId: string, nodeId: string) {
    return this.prisma.userNode.create({
      data: { userId, nodeId },
    });
  }

  async getPassport(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        eloScores: true,
        achievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' },
        },
        receivedReviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { author: { select: { displayName: true, avatarUrl: true } } },
        },
        receivedTransactions: {
          where: { status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take: 10,
          include: { service: { select: { title: true } } },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
