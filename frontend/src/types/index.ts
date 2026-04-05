// ─────────────────────────────────────────────
// Palomino Village OS — Tipos compartidos Frontend
// Alineados con schema Prisma: uuid, Decimal, lat/lng,
// TransactionStatus simplificado, elo en User
// ─────────────────────────────────────────────

export type UserRole = 'TOURIST' | 'LOCAL' | 'BUSINESS' | 'ADMIN';
export type PostCategory = 'PROPERTY' | 'SERVICE' | 'LOGISTICS' | 'JOB' | 'EVENT' | 'GENERAL';
export type PostStatus = 'ACTIVE' | 'EXPIRED' | 'MODERATED' | 'COMPLETED';
export type TransactionStatus =
  | 'PENDING_RESERVATION'
  | 'RESERVED'
  | 'QR_GENERATED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'REFUNDED';
export type TournamentType = 'BILLIARDS' | 'SURF' | 'SERVICE_RATING' | 'CUSTOM';

export interface User {
  id: string;
  phone: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  roles: UserRole[];
  elo: number; // ELO global (snapshot)
  preferredLang: string;
  isVerified: boolean;
}

export interface Node {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  radius: number; // KM
}

export interface Post {
  id: string;
  authorId: string;
  nodeId: string;
  category: PostCategory;
  status: PostStatus;
  title: string;
  body: string;
  images: string[];
  tags: string[];
  lat?: number;
  lng?: number;
  isVerified: boolean;
  viewCount: number;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    roles: UserRole[];
    isVerified: boolean;
  };
  _count?: {
    jobApplications: number;
  };
}

export interface Transaction {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  status: TransactionStatus;
  totalAmount: number;
  reservationAmount: number; // 10%
  remainingAmount: number;   // 90%
  currency: string;
  qrSignature?: string; // @unique — anti-doble-cobro
  gpsVerified: boolean;
  gpsDistanceMeters?: number;
  escrowReleaseAt?: string;
  createdAt: string;
  completedAt?: string;
  client: { displayName: string; avatarUrl?: string };
  provider: { displayName: string; avatarUrl?: string };
  service: { title: string };
}

export interface EloScore {
  id: string;
  userId: string;
  type: TournamentType;
  score: number;
  wins: number;
  losses: number;
  streak: number;
  peakScore: number;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FeedFilters {
  category?: PostCategory;
  tags?: string[];
  search?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
}
