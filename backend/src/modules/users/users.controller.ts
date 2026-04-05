import { Controller, Get, Patch, Post, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';

@ApiTags('Users & Passport')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  async getMyProfile(@Req() req: Request) {
    const userId = (req as any).user?.id || 'demo-user';
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar perfil' })
  async updateProfile(
    @Req() req: Request,
    @Body() data: { displayName?: string; bio?: string; preferredLang?: string },
  ) {
    const userId = (req as any).user?.id || 'demo-user';
    return this.usersService.updateProfile(userId, data);
  }

  @Get(':id/passport')
  @ApiOperation({ summary: 'Ver pasaporte phygital de un usuario (logros, ELO, historial)' })
  async getPassport(@Param('id') id: string) {
    return this.usersService.getPassport(id);
  }

  @Post('me/nodes/:nodeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unirse a un nodo geográfico' })
  async joinNode(@Req() req: Request, @Param('nodeId') nodeId: string) {
    const userId = (req as any).user?.id || 'demo-user';
    return this.usersService.joinNode(userId, nodeId);
  }
}
