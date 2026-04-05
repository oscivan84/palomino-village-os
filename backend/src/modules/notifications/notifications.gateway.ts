import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
      this.logger.log(`User ${userId} connected (socket: ${client.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
      this.logger.log(`User ${userId} disconnected`);
    }
  }

  /**
   * Envía un evento a un usuario específico (todas sus sesiones).
   */
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Broadcast a todos los conectados de un nodo.
   */
  broadcastToNode(nodeId: string, event: string, data: any) {
    this.server.to(`node:${nodeId}`).emit(event, data);
  }

  @SubscribeMessage('join-node')
  handleJoinNode(client: Socket, nodeId: string) {
    client.join(`node:${nodeId}`);
    this.logger.log(`Socket ${client.id} joined node:${nodeId}`);
  }

  /**
   * Suscripción a actualizaciones en tiempo real de torneos.
   */
  @SubscribeMessage('join-tournament')
  handleJoinTournament(client: Socket, tournamentId: string) {
    client.join(`tournament:${tournamentId}`);
  }

  emitTournamentUpdate(tournamentId: string, data: any) {
    this.server.to(`tournament:${tournamentId}`).emit('tournament-update', data);
  }

  emitMatchResult(tournamentId: string, data: any) {
    this.server.to(`tournament:${tournamentId}`).emit('match-result', data);
  }
}
