import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GpsService {
  private readonly maxDistanceMeters: number;

  constructor(private config: ConfigService) {
    this.maxDistanceMeters = this.config.get<number>(
      'GPS_MAX_DISTANCE_METERS',
      100,
    );
  }

  /**
   * Calcula la distancia en metros entre dos coordenadas GPS
   * usando la fórmula de Haversine.
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Verifica que técnico y cliente estén dentro del radio permitido (100m).
   */
  verifyProximity(
    providerLat: number,
    providerLon: number,
    clientLat: number,
    clientLon: number,
  ): { isValid: boolean; distanceMeters: number } {
    const distance = this.calculateDistance(
      providerLat,
      providerLon,
      clientLat,
      clientLon,
    );

    return {
      isValid: distance <= this.maxDistanceMeters,
      distanceMeters: Math.round(distance * 100) / 100,
    };
  }
}
