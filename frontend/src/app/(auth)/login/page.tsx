'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api';
import { Phone, MessageCircle, Loader2, ArrowRight } from 'lucide-react';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRequestOtp() {
    if (!phone.trim()) return;
    setLoading(true);
    setError('');

    try {
      await authApi.requestOtp(phone, channel);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Error al enviar OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.length !== 6) return;
    setLoading(true);
    setError('');

    try {
      const result = await authApi.verifyOtp(phone, otpCode);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      window.location.href = '/muro';
    } catch (err: any) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-palm-700">Village OS</h1>
          <p className="text-gray-500 mt-1">Palomino Community Platform</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Tu número de teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 300 123 4567"
                className="input-field text-lg"
                autoFocus
              />
            </div>

            {/* Channel selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setChannel('whatsapp')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium min-h-touch flex items-center justify-center gap-2 ${
                  channel === 'whatsapp'
                    ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                    : 'bg-gray-50 text-gray-400'
                }`}
              >
                <MessageCircle size={18} />
                WhatsApp
              </button>
              <button
                onClick={() => setChannel('sms')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium min-h-touch flex items-center justify-center gap-2 ${
                  channel === 'sms'
                    ? 'bg-ocean-100 text-ocean-700 ring-2 ring-ocean-300'
                    : 'bg-gray-50 text-gray-400'
                }`}
              >
                <Phone size={18} />
                SMS
              </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleRequestOtp}
              disabled={loading || !phone.trim()}
              className="btn-primary w-full text-base"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Recibir código
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Código de verificación
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Enviado a {phone} vía {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="000000"
                className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.length !== 6}
              className="btn-primary w-full text-base"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                'Verificar'
              )}
            </button>

            <button
              onClick={() => {
                setStep('phone');
                setOtpCode('');
                setError('');
              }}
              className="btn-outline w-full text-sm"
            >
              Cambiar número
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Sin contraseñas. Acceso seguro con código de un solo uso.
        </p>
      </div>
    </div>
  );
}
