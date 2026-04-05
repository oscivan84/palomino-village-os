import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { PostCategory, PostStatus, Prisma } from '@prisma/client';

export interface FeedFilters {
  nodeId: string;
  category?: PostCategory;
  tags?: string[];
  search?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Feed categorizado con filtros por etiquetas, búsqueda y geolocalización.
   */
  async getFeed(filters: FeedFilters) {
    const { nodeId, category, tags, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      nodeId,
      status: PostStatus.ACTIVE,
      ...(category && { category }),
      ...(tags?.length && { tags: { hasSome: tags } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              roles: true,
              isVerified: true,
            },
          },
          _count: { select: { jobApplications: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    // Filtro por geolocalización (post-query, calculado en app)
    let filteredPosts = posts;
    if (filters.latitude && filters.longitude && filters.radiusKm) {
      filteredPosts = posts.filter((post) => {
        if (!post.lat || !post.lng) return true;
        const dist = this.haversineKm(
          filters.latitude!,
          filters.longitude!,
          post.lat,
          post.lng,
        );
        return dist <= filters.radiusKm!;
      });
    }

    return {
      data: filteredPosts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createPost(
    authorId: string,
    data: {
      nodeId: string;
      category: PostCategory;
      title: string;
      body: string;
      tags?: string[];
      images?: string[];
      lat?: number;
      lng?: number;
      expiresAt?: Date;
    },
  ) {
    return this.prisma.post.create({
      data: { authorId, ...data },
      include: {
        author: {
          select: { id: true, displayName: true, avatarUrl: true, isVerified: true },
        },
      },
    });
  }

  async getPost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            roles: true,
            isVerified: true,
          },
        },
        jobApplications: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
    if (!post) throw new NotFoundException('Publicación no encontrada');

    // Incrementar vistas
    await this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return post;
  }

  /**
   * Job Board: postulación rápida a ofertas de trabajo.
   */
  async applyToJob(postId: string, userId: string, message?: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    if (post.category !== PostCategory.JOB) {
      throw new NotFoundException('Esta publicación no es una oferta de trabajo');
    }

    return this.prisma.jobApplication.create({
      data: { postId, userId, message },
    });
  }

  private haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
