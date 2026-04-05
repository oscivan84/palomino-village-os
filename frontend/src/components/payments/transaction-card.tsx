'use client';

import {
  Clock,
  CheckCircle,
  QrCode,
  AlertTriangle,
  XCircle,
  Shield,
} from 'lucide-react';
import type { Transaction, TransactionStatus } from '@/types';

const statusConfig: Record<
  TransactionStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  PENDING_RESERVATION: { label: 'Reservando 10%', color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  RESERVED: { label: 'Reservado — Técnico en camino', color: 'text-ocean-600 bg-ocean-50', icon: Shield },
  QR_GENERATED: { label: 'QR Listo — Escanea para pagar', color: 'text-purple-600 bg-purple-50', icon: QrCode },
  COMPLETED: { label: 'Completado', color: 'text-palm-600 bg-palm-50', icon: CheckCircle },
  DISPUTED: { label: 'En disputa', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
  REFUNDED: { label: 'Reembolsado', color: 'text-gray-600 bg-gray-50', icon: XCircle },
};

interface Props {
  transaction: Transaction;
  role: 'client' | 'provider';
  onPress?: () => void;
}

export function TransactionCard({ transaction, role, onPress }: Props) {
  const config = statusConfig[transaction.status];
  const StatusIcon = config.icon;
  const counterpart =
    role === 'client' ? transaction.provider : transaction.client;

  return (
    <button
      onClick={onPress}
      className="card w-full text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{transaction.service.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {role === 'client' ? 'Proveedor' : 'Cliente'}:{' '}
            {counterpart.displayName}
          </p>
        </div>
        <div className="text-right">
          <span className="font-bold text-base">
            ${transaction.totalAmount.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400 ml-1">
            {transaction.currency}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className={`badge ${config.color}`}>
          <StatusIcon size={12} className="mr-1" />
          {config.label}
        </span>

        {transaction.gpsVerified && (
          <span className="text-xs text-palm-500">
            GPS: {transaction.gpsDistanceMeters}m
          </span>
        )}
      </div>

      {/* Barra de progreso del escrow 10/90 */}
      {transaction.status !== 'COMPLETED' &&
        transaction.status !== 'REFUNDED' && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Reserva 10%: ${transaction.reservationAmount.toLocaleString()}</span>
              <span>Saldo 90%: ${transaction.remainingAmount.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-palm-500 rounded-full transition-all"
                style={{
                  width:
                    transaction.status === 'PENDING_RESERVATION'
                      ? '5%'
                      : transaction.status === 'RESERVED'
                        ? '10%'
                        : transaction.status === 'QR_GENERATED'
                          ? '50%'
                          : '100%',
                }}
              />
            </div>
          </div>
        )}
    </button>
  );
}
