import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageCircle } from 'lucide-react';
import { SiteSettingsData, StoreLocationItem } from '../types/store.ts';

interface ContactPageProps {
  settings: SiteSettingsData | null;
  locations: StoreLocationItem[];
  onSubmitMessage: (data: {
    name: string;
    phone: string;
    email?: string;
    message: string;
  }) => Promise<any>;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  settings,
  locations,
  onSubmitMessage,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primaryLocation = locations[0] || {
    name: 'Chhayaswori Impex — Suncity Flagship Store',
    municipality: 'Kageshwori Manohara',
    area: 'Suncity, Kathmandu',
    landmark: 'Nearby Big Mart',
    fullAddress:
      'Suncity, Kageshwori Manohara, Kathmandu, Nepal (Nearby Big Mart)',
    openingHours: 'Sun – Fri: 10:00 AM – 7:30 PM | Sat: 11:00 AM – 6:00 PM',
    phone: '',
  };

  const whatsappClean = (settings?.whatsappNumber || '').replace(/[^0-9]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmitMessage({ name, phone, email, message });
      setSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="max-w-2xl mb-12">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 block mb-1">
          Get in Touch
        </span>
        <h1 className="text-3xl font-display font-bold uppercase text-neutral-950">
          Contact & Store Locations
        </h1>
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
          Have questions regarding shoe sizing, bulk orders, comfortable orthotic footwear, or delivery anywhere in Nepal? Reach out to our team or visit our flagship store in Suncity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Store Details & Map Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-neutral-200 bg-[#F9F9F8] p-6 sm:p-8 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-200">
              Flagship Store
            </h2>

            <div className="space-y-4 text-xs text-neutral-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-neutral-950 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neutral-950">{primaryLocation.name}</p>
                  <p className="mt-0.5">{primaryLocation.fullAddress}</p>
                  <p className="text-neutral-500 mt-0.5">Landmark: {primaryLocation.landmark}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-neutral-950 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neutral-950">Business Hours</p>
                  <p className="mt-0.5 text-neutral-600">{primaryLocation.openingHours}</p>
                </div>
              </div>

              {(settings?.phone || primaryLocation.phone) && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-neutral-950 shrink-0" />
                  <span className="font-mono">{settings?.phone || primaryLocation.phone}</span>
                </div>
              )}

              {settings?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-neutral-950 shrink-0" />
                  <span>{settings.email}</span>
                </div>
              )}
            </div>

            {whatsappClean.length >= 10 && (
              <div className="pt-4 border-t border-neutral-200">
                <a
                  href={`https://wa.me/${whatsappClean}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Message Form */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 p-6 sm:p-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-100 mb-6">
            Send an Inquiry
          </h2>

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Thank you! Your message has been received by our store management.</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full p-2.5 font-mono border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Message / Sizing Question
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you with your footwear choice?"
                  className="w-full p-2.5 border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Sending...' : 'Submit Inquiry'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
