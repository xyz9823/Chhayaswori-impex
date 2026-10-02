import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types/store.ts';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onSuccess: (updatedProfile: UserProfile) => void;
  requestOtpApi: (phone: string) => Promise<{
    phone: string;
    isDevelopmentMode: boolean;
    devDisclaimer?: string;
    devOtpCode?: string;
    deliveryNotice: string;
  }>;
  verifyOtpApi: (phone: string, code: string) => Promise<UserProfile>;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSuccess,
  requestOtpApi,
  verifyOtpApi,
}) => {
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'REQUEST' | 'VERIFY'>(
    userProfile?.phone && !userProfile?.phoneVerified ? 'REQUEST' : 'REQUEST'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devInfo, setDevInfo] = useState<{
    isDevelopmentMode: boolean;
    devDisclaimer?: string;
    devOtpCode?: string;
    deliveryNotice: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await requestOtpApi(phone);
      setDevInfo(res);
      setStep('VERIFY');
      if (res.devOtpCode) {
        setCode(res.devOtpCode);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const updated = await verifyOtpApi(phone, code);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white border border-neutral-200 overflow-hidden shadow-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-neutral-950" />
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-neutral-950">
              Phone Number Verification
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-950"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Development Mode Notice Banner (As instructed) */}
        <div className="mt-4 p-3 bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs leading-relaxed">
          <span className="font-semibold block uppercase tracking-wider text-[10px] text-neutral-600 mb-0.5">
            DEVELOPMENT / TEST ONLY
          </span>
          SMS service is currently in development/test mode. Real SMS credentials are not required.
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {step === 'REQUEST' ? (
          <form onSubmit={handleRequest} className="mt-6 space-y-4">
            <p className="text-xs text-neutral-600 leading-relaxed">
              In accordance with store policy, all customers must verify a valid Nepal mobile number before completing an order.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-950 mb-1.5">
                Nepal Mobile Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9841000000"
                className="w-full p-3 text-sm font-mono border border-neutral-300 focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-600">
              <span>Code sent to <strong className="font-mono text-neutral-950">{phone}</strong></span>
              <button
                type="button"
                onClick={() => setStep('REQUEST')}
                className="text-neutral-900 underline text-[11px]"
              >
                Change Number
              </button>
            </div>

            {/* Test OTP code autofill helper */}
            {devInfo?.devOtpCode && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold">Simulated Test OTP:</span>{' '}
                  <span className="font-mono font-bold tracking-widest text-emerald-950 text-sm">
                    {devInfo.devOtpCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCode(devInfo.devOtpCode || '')}
                  className="px-2.5 py-1 bg-emerald-800 text-white text-[10px] font-semibold uppercase"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-950 mb-1.5">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                placeholder="123456"
                className="w-full p-3 text-center text-lg font-mono tracking-[0.3em] font-bold border border-neutral-300 focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRequest}
                disabled={loading}
                className="px-4 py-3 border border-neutral-300 text-xs font-medium uppercase tracking-wider text-neutral-700 hover:border-neutral-950 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Resend
              </button>
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="flex-1 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Phone'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
