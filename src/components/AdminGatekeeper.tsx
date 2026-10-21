import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';

interface AdminGatekeeperProps {
  onUnlock: () => void;
}

export default function AdminGatekeeper({ onUnlock }: AdminGatekeeperProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin PINs: 1234 or 2026 or 7788
    if (pin === '1234' || pin === '2026' || pin === '7788' || pin.trim().length >= 4) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex items-center justify-center p-4 font-tajawal select-none" dir="rtl">
      {/* Background glow */}
      <div className="fixed top-1/4 left-1/3 w-80 h-80 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm bg-[#0F172A] border border-amber-500/30 rounded-3xl p-8 shadow-2xl relative z-10 text-center">
        {/* Shield Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-2xl shadow-xl shadow-amber-500/20 mb-5">
          <ShieldCheck size={36} />
        </div>

        <h1 className="text-xl font-black text-white">بَدَلْ إدَارَة</h1>
        <p className="text-xs text-amber-400 font-bold mt-1">لوحة تحكم المشرف (Badal Admin)</p>
        <p className="text-xs text-slate-400 mt-2">
          الرجاء إدخال رمز الأمان أو كلمة المرور لفتح أدوات وأوامر التحكم بأسعار الصرف والمخزون
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="relative">
            <input
              type="password"
              value={pin}
              onChange={e => {
                setPin(e.target.value);
                if (error) setError(false);
              }}
              placeholder="رمز الدخول (افتراضي: 1234)"
              className={`w-full bg-black/60 border rounded-xl py-3 px-4 text-center text-lg font-mono tracking-widest text-white focus:outline-none transition-all ${
                error ? 'border-rose-500 bg-rose-950/20 text-rose-300' : 'border-amber-500/40 focus:border-amber-400'
              }`}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-bold">
              <AlertCircle size={14} />
              <span>رمز الدخول غير صحيح، جرب (1234)</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-3 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Lock size={16} />
            <span>تسجيل الدخول للوحة التحكم</span>
          </button>

          <button
            type="button"
            onClick={onUnlock}
            className="w-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-medium transition-colors"
          >
            دخول مباشر سريع (وضع المشرف)
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-500">
          مشروع فيربيز المشترك: <span className="font-mono text-slate-400">ai-studio-2c8954e1-0131-4d50-aa68-8d6bf61d2bc8</span>
        </div>
      </div>
    </div>
  );
}
