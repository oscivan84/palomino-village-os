import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './config/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CommunityModule } from './modules/community/community.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CommunityModule,
    PaymentsModule,
    TournamentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
