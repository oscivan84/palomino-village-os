'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { TransactionCard } from '@/components/payments/transaction-card';
import { QrScanner } from '@/components/payments/qr-scanner';
import { QrGenerator } from '@/components/payments/qr-generator';
import { Loader2, QrCode, Scan } from 'lucide-react';
import type { Transaction } from '@/types';

type Tab = 'history' | 'scan' | 'generate';

export default function PagosPage() {
  const [tab, setTab] = useState<Tab>('history');
  const [role, setRole] = useState<'client' | 'provider'>('client');

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', role],
    queryFn: () => paymentsApi.getTransactions(role),
  });

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-touch ${
            tab === 'history'
              ? 'bg-palm-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Historial
        </button>
        <button
          onClick={() => setTab('scan')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-touch flex items-center justify-center gap-1.5 ${
            tab === 'scan'
              ? 'bg-ocean-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Scan size={16} />
          Escanear QR
        </button>
        <button
          onClick={() => setTab('generate')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-touch flex items-center justify-center gap-1.5 ${
            tab === 'generate'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <QrCode size={16} />
          Generar QR
        </button>
      </div>

      {tab === 'history' && (
        <>
          {/* Role toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setRole('client')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium min-h-touch ${
                role === 'client'
                  ? 'bg-palm-100 text-palm-700'
                  : 'bg-gray-50 text-gray-400'
              }`}
            >
              Como Cliente
            </button>
            <button
              onClick={() => setRole('provider')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium min-h-touch ${
                role === 'provider'
                  ? 'bg-ocean-100 text-ocean-700'
                  : 'bg-gray-50 text-gray-400'
              }`}
            >
              Como Proveedor
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-palm-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {transactions?.map((tx) => (
                <TransactionCard key={tx.id} transaction={tx} role={role} />
              ))}
              {transactions?.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">
                  No hay transacciones
                </p>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'scan' && <QrScanner />}

      {tab === 'generate' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Selecciona una transacción pendiente para generar el QR de
            confirmación.
          </p>
          {/* En producción: lista de transacciones pendientes donde soy proveedor */}
          <QrGenerator transactionId="demo-tx-id" />
        </div>
      )}
    </div>
  );
}
