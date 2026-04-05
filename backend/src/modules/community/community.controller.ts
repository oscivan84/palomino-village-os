import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { CommunityService } from './community.service';
import { PostCategory } from '@prisma/client';

@ApiTags('Community Wall')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('feed/:nodeId')
  @ApiOperation({ summary: 'Feed categorizado con filtros inteligentes y geolocalización' })
  @ApiQuery({ name: 'category', required: false, enum: ['PROPERTY', 'SERVICE', 'LOGISTICS', 'JOB', 'EVENT', 'GENERAL'] })
  @ApiQuery({ name: 'tags', required: false, type: String, description: 'Comma-separated tags' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'lat', required: false })
  @ApiQuery({ name: 'lng', required: false })
  @ApiQuery({ name: 'radius', required: false, description: 'Radius in km' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFeed(
    @Param('nodeId') nodeId: string,
    @Query('category') category?: PostCategory,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.getFeed({
      nodeId,
      category,
      tags: tags?.split(','),
      search,
      latitude: lat ? parseFloat(lat) : undefined,
      longitude: lng ? parseFloat(lng) : undefined,
      radiusKm: radius ? parseFloat(radius) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Post('posts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear publicación en el muro' })
  async createPost(@Body() body: any, @Req() req: Request) {
    const authorId = (req as any).user?.id || 'demo-user';
    return this.communityService.createPost(authorId, body);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Ver detalle de una publicación' })
  async getPost(@Param('id') id: string) {
    return this.communityService.getPost(id);
  }

  @Post('posts/:id/apply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Postulación rápida a oferta de trabajo (Job Board)' })
  async applyToJob(
    @Param('id') postId: string,
    @Req() req: Request,
    @Body('message') message?: string,
  ) {
    const userId = (req as any).user?.id || 'demo-user';
    return this.communityService.applyToJob(postId, userId, message);
  }
}
