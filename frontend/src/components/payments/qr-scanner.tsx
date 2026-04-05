'use client';

import { useState } from 'react';
import { paymentsApi } from '@/lib/api';
import { Camera, CheckCircle, XCircle, Loader2, MapPin } from 'lucide-react';

interface Props {
  onSuccess?: (result: {
    transaction: any;
    fundsReleased: number;
  }) => void;
  onError?: (error: string) => void;
}

/**
 * Scanner QR que activa verificación GPS simultánea.
 * Usa react-qr-reader (cámara trasera) + Geolocation API.
 *
 * Flujo:
 * 1. Escanear QR → parsear { transactionId, amount, signature }
 * 2. Obtener GPS del cliente en el momento del escaneo
 * 3. Enviar a API: verify-and-release (firma HMAC + proximidad GPS)
 */
export function QrScanner({ onSuccess, onError }: Props) {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  async function handleScan(data: string | null) {
    if (!data || processing) return;

    setProcessing(true);

    try {
      // 1. Parsear QR: { transactionId, amount, signature }
      const parsed = JSON.parse(data);
      const { transactionId, amount, signature } = parsed;

      if (!transactionId || !amount || !signature) {
        throw new Error('QR inválido: faltan campos requeridos');
      }

      // 2. Obtener ubicación del cliente en el momento del escaneo
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          }),
      );

      const { latitude, longitude } = position.coords;

      // 3. Enviar a API: verificar firma HMAC + proximidad GPS → liberar fondos
      const scanResult = await paymentsApi.scanQr(
        transactionId,
        amount,
        signature,
        latitude,
        longitude,
      );

      setResult('success');
      setMessage(
        `Pago completado. Saldo liberado: $${scanResult.fundsReleased.toLocaleString()} COP`,
      );
      onSuccess?.(scanResult);
    } catch (err: any) {
      setResult('error');
      const msg = err.message || 'Error al procesar el QR';
      setMessage(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      setScanning(false);
    }
  }

  // Resultado final
  if (result) {
    return (
      <div className="card text-center space-y-4">
        {result === 'success' ? (
          <>
            <CheckCircle size={48} className="mx-auto text-palm-500" />
            <h3 className="font-bold text-lg text-palm-700">Servicio Confirmado</h3>
          </>
        ) : (
          <>
            <XCircle size={48} className="mx-auto text-red-500" />
            <h3 className="font-bold text-lg text-red-700">Error de Verificación</h3>
          </>
        )}
        <p className="text-sm text-gray-600">{message}</p>
        <button
          onClick={() => {
            setResult(null);
            setMessage('');
          }}
          className="btn-secondary w-full"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      {scanning ? (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Pagar Saldo Final (90%)</h2>

          {/* QR Reader: cámara trasera */}
          <QrReaderLazy onScan={handleScan} />

          {processing && (
            <p className="animate-pulse text-sm text-ocean-600 text-center">
              Verificando ubicación y pago...
            </p>
          )}

          <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
            <MapPin size={12} />
            Se verificará tu GPS al escanear (máx 100m del técnico)
          </div>
          <button
            onClick={() => setScanning(false)}
            className="btn-outline w-full"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="text-center space-y-4 py-4">
          <Camera size={48} className="mx-auto text-gray-300" />
          <div>
            <h3 className="font-semibold">Escanear QR del Técnico</h3>
            <p className="text-sm text-gray-500 mt-1">
              Escanea el código QR para confirmar el servicio y liberar el saldo (90%)
            </p>
          </div>
          <button
            onClick={() => setScanning(true)}
            className="btn-primary w-full"
          >
            <Camera size={20} />
            Abrir Escáner
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Lazy-load de react-qr-reader para evitar carga en SSR.
 */
function QrReaderLazy({ onScan }: { onScan: (data: string | null) => void }) {
  const [QrReader, setQrReader] = useState<any>(null);

  if (!QrReader) {
    import('react-qr-reader').then((mod) => {
      setQrReader(() => mod.QrReader);
    });
    return (
      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden">
      <QrReader
        onResult={(result: any) => {
          if (result) onScan(result.getText());
        }}
        constraints={{ facingMode: 'environment' }}
        containerStyle={{ borderRadius: '0.75rem' }}
      />
    </div>
  );
}
