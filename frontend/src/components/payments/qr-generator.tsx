'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { paymentsApi } from '@/lib/api';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  transactionId: string;
  onGenerated?: (data: { qrImage: string; signature: string }) => void;
}

export function QrGenerator({ transactionId, onGenerated }: Props) {
  const [qrData, setQrData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      // Obtener GPS del técnico
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          }),
      );

      const result = await paymentsApi.generateQr(
        transactionId,
        position.coords.latitude,
        position.coords.longitude,
      );

      // QR contiene: { transactionId, amount, signature }
      const qrPayload = JSON.stringify({
        transactionId: result.transactionId,
        amount: result.amount,
        signature: result.signature,
      });
      setQrData(qrPayload);
      onGenerated?.(result);
    } catch (err: any) {
      setError(err.message || 'Error al generar QR');
    } finally {
      setLoading(false);
    }
  }

  if (qrData) {
    return (
      <div className="card text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-palm-600">
          <CheckCircle size={20} />
          <span className="font-semibold">QR Generado</span>
        </div>
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-2xl shadow-inner">
            <QRCodeSVG value={qrData} size={240} level="M" />
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Muestra este QR al cliente para confirmar el servicio
        </p>
        <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
          <MapPin size={12} />
          GPS verificado — ambos deben estar a menos de 100m
        </div>
      </div>
    );
  }

  return (
    <div className="card text-center space-y-4">
      <p className="text-sm text-gray-600">
        Genera un QR firmado digitalmente para confirmar la finalización del
        servicio. El cliente lo escaneará para liberar los fondos.
      </p>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <>
            <MapPin size={20} />
            Generar QR de Confirmación
          </>
        )}
      </button>
    </div>
  );
}
