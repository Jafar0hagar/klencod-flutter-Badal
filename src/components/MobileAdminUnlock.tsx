import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserCheck, 
  Truck, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import BadalLogo from './BadalLogo';
import { authenticateWithIdAndPin, AuthSessionUser } from '../utils/firebase';

interface MobileAdminUnlockProps {
  onUnlockSuccess: (user: AuthSessionUser) => void;
  onCancel: () => void;
  isDarkMode: boolean;
  language: 'ar' | 'en';
}

export default function MobileAdminUnlock({
  onUnlockSuccess,
  onCancel,
  isDarkMode,
  language
}: MobileAdminUnlockProps) {
  const [userId, setUserId] = useState<string>('ADM-2026');
  const [password, setPassword] = useState<string>('20268800');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال اسم المستخدم أو المعرّف' : 'Please enter Username or ID');
      return;
    }
    if (!password.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال كلمة المرور' : 'Please enter Password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await authenticateWithIdAndPin(userId, password);
      if (res.success && res.user) {
        onUnlockSuccess(res.user);
      } else {
        setError(res.error || (language === 'ar' ? 'بيانات الدخول غير صحيحة، تأكد من المعرف وكلمة المرور' : 'Invalid credentials'));
      }
    } catch (err) {
      setError(language === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة لاحقاً' : 'Login error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const setPreset = (id: string, pass: string) => {
    setUserId(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div 
      className={`w-full h-full flex flex-col justify-between p-4 select-none overflow-y-auto ${
        isDarkMode ? 'bg-[#0E0C0A] text-stone-100' : 'bg-[#FAF7F0] text-stone-900'
      }`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <button
          onClick={onCancel}
          type="button"
          className="px-2.5 py-1.5 rounded-xl bg-stone-500/10 text-stone-400 hover:text-stone-200 transition-all flex items-center gap-1 text-xs font-tajawal cursor-pointer"
        >
          <ArrowRight className={`w-3.5 h-3.5 ${language === 'en' ? 'rotate-180' : ''}`} />
          <span>{language === 'ar' ? 'الرجوع للإعدادات' : 'Back to Settings'}</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'بوابة إدارة الأسعار المعتمدة' : 'Price Management Portal'}</span>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="w-full max-w-sm mx-auto my-auto py-4 flex flex-col items-center">
        {/* Brand Icon */}
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FAF1D6] to-[#EBC173] flex items-center justify-center border border-[#D5A549]/40 shadow-lg p-2 mb-2.5">
          <BadalLogo size={42} withTag={false} />
        </div>

        <h2 className="text-base font-black text-amber-500 font-cairo">
          {language === 'ar' ? 'تسجيل دخول المشرف' : 'Supervisor Sign In'}
        </h2>
        <p className="text-[11px] text-stone-400 font-tajawal max-w-[280px] text-center mt-1">
          {language === 'ar' 
            ? 'تسجيل الدخول إلى لوحة التحكم لإدارة أسعار العملات والسلع وبث التنبيهات'
            : 'Sign in to manage exchange rates, commodity prices, and broadcasts'}
        </p>

        {/* Quick Role Selection Preset Chips */}
        <div className="grid grid-cols-2 gap-2 w-full mt-4 mb-3">
          <button
            type="button"
            onClick={() => setPreset('ADM-2026', '20268800')}
            className={`p-2 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2 ${
              userId === 'ADM-2026'
                ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-xs'
                : (isDarkMode ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-white border-stone-200 text-stone-600')
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] font-bold">{language === 'ar' ? 'المشرف الرئيسي' : 'Main Admin'}</div>
              <div className="text-[8.5px] font-mono text-stone-500 truncate">ADM-2026</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPreset('SUPV-101', '87654321')}
            className={`p-2 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2 ${
              userId === 'SUPV-101'
                ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-xs'
                : (isDarkMode ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-white border-stone-200 text-stone-600')
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] font-bold">{language === 'ar' ? 'مشرف الأسعار' : 'Rates Admin'}</div>
              <div className="text-[8.5px] font-mono text-stone-500 truncate">SUPV-101</div>
            </div>
          </button>
        </div>

        {/* Real Form Inputs (No on-screen keyboard, clean inputs) */}
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          {/* User ID Field */}
          <div>
            <label className="block text-[11px] font-bold text-stone-300 font-tajawal mb-1">
              {language === 'ar' ? 'اسم المستخدم أو المعرّف (User ID):' : 'Username / Account ID:'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setError(null);
                }}
                placeholder="ADM-2026 أو SUP-8801"
                className={`w-full pr-9 pl-3 py-2.5 rounded-xl border text-xs font-mono font-bold outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-stone-900 border-stone-700/80 text-stone-100 focus:border-amber-500 focus:bg-stone-900/90' 
                    : 'bg-white border-stone-300 text-stone-900 focus:border-amber-500'
                }`}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[11px] font-bold text-stone-300 font-tajawal mb-1">
              {language === 'ar' ? 'كلمة المرور أو رمز الأمان (Password / PIN):' : 'Password or PIN:'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••"
                className={`w-full pr-9 pl-10 py-2.5 rounded-xl border text-xs font-mono font-bold outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-stone-900 border-stone-700/80 text-stone-100 focus:border-amber-500 focus:bg-stone-900/90' 
                    : 'bg-white border-stone-300 text-stone-900 focus:border-amber-500'
                }`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-tajawal">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-[#D5A549] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer info */}
      <div className="text-center text-[9.5px] text-stone-500 font-tajawal shrink-0 pt-2 border-t border-stone-800/40">
        منظومة الأمان بَدَلْ • متصلة ومزامنة فورياً مع Google Firebase Firestore
      </div>
    </div>
  );
}
