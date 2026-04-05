'use client';

import { useState } from 'react';
import { QrScanner } from '@/components/payments/qr-scanner';
import { QrGenerator } from '@/components/payments/qr-generator';
import { QrCode, Scan } from 'lucide-react';

type Tab = 'history' | 'scan' | 'generate';

export default function PagosPage() {
  const [tab, setTab] = useState<Tab>('history');

  return (
    <div className="space-y-4">
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
        <p className="text-center text-gray-400 text-sm py-8">
          No hay transacciones — Backend no conectado
        </p>
      )}

      {tab === 'scan' && <QrScanner />}

      {tab === 'generate' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Selecciona una transacción pendiente para generar el QR de confirmación.
          </p>
          <QrGenerator transactionId="demo-tx-id" />
        </div>
      )}
    </div>
  );
}
