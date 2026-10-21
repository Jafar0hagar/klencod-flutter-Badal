import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Coins, 
  Package, 
  Bell, 
  ShoppingBag, 
  PhoneCall, 
  Smartphone, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Send, 
  Check, 
  Clock, 
  CheckCircle2, 
  X, 
  Save, 
  RefreshCw, 
  Lock,
  Download,
  Terminal,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { Currency, Product, Order, WhatsAppConfig, SystemAlert } from '../types';
import { broadcastSystemAlert, deleteSystemAlertInDb } from '../utils/firebase';
import { playNotificationSound } from '../utils/audio';

interface BadalAdminDashboardProps {
  currencies: Currency[];
  onUpdateCurrencies: (currencies: Currency[]) => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  orders: Order[];
  onUpdateOrders: (orders: Order[]) => void;
  currentFrancRate: number;
  onUpdateFrancRate: (rate: number) => void;
  whatsAppConfig: WhatsAppConfig;
  onUpdateWhatsAppConfig: (config: WhatsAppConfig) => void;
  systemAlerts: SystemAlert[];
  onLogout: () => void;
}

export default function BadalAdminDashboard({
  currencies,
  onUpdateCurrencies,
  products,
  onUpdateProducts,
  orders,
  onUpdateOrders,
  currentFrancRate,
  onUpdateFrancRate,
  whatsAppConfig,
  onUpdateWhatsAppConfig,
  systemAlerts,
  onLogout
}: BadalAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'currencies' | 'products' | 'alerts' | 'orders' | 'whatsapp' | 'flutter'>('currencies');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Franc Pivot Rate Edit
  const [editingFranc, setEditingFranc] = useState(false);
  const [francInput, setFrancInput] = useState(currentFrancRate.toString());

  // Add Currency Modal / State
  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [newCurrId, setNewCurrId] = useState('');
  const [newCurrName, setNewCurrName] = useState('');
  const [newCurrBuy, setNewCurrBuy] = useState('');
  const [newCurrSell, setNewCurrSell] = useState('');

  // Add Product State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('جوال 50 كجم');
  const [newProdCategory, setNewProdCategory] = useState<'sugar' | 'flour' | 'oil' | 'other'>('sugar');

  // Broadcast Alert State
  const [alertTitle, setAlertTitle] = useState('تحديث عاجل للأسعار');
  const [alertText, setAlertText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Quick Inline Toast Helper
  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3000);
  };

  // 1. Currencies Handlers
  const handlePriceChange = (id: string, field: 'buyPrice' | 'sellPrice', value: number) => {
    const updated = currencies.map(c => {
      if (c.id === id) {
        return { ...c, [field]: value, updatedAt: Date.now() };
      }
      return c;
    });
    onUpdateCurrencies(updated);
  };

  const handleToggleTrend = (id: string) => {
    const updated = currencies.map(c => {
      if (c.id === id) {
        const nextChange: 'up' | 'down' | 'stable' = 
          c.change === 'up' ? 'down' : (c.change === 'down' ? 'stable' : 'up');
        return { ...c, change: nextChange, updatedAt: Date.now() };
      }
      return c;
    });
    onUpdateCurrencies(updated);
    showToast('تم تحديث مؤشر الاتجاه بنجاح');
  };

  const handleAddCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurrId || !newCurrName || !newCurrBuy) return;

    const newCurrency: Currency = {
      id: newCurrId.toLowerCase().trim(),
      name: newCurrName.trim(),
      code: newCurrId.toUpperCase().trim(),
      symbol: newCurrId.toUpperCase().trim(),
      price: parseFloat(newCurrBuy) || 0,
      buyPrice: parseFloat(newCurrBuy) || 0,
      sellPrice: parseFloat(newCurrSell) || parseFloat(newCurrBuy),
      lastUpdated: 'الآن',
      flag: '🌐',
      trend: 'stable',
      change: 'stable',
      country: 'دولي',
      updatedAt: Date.now()
    };

    onUpdateCurrencies([...currencies, newCurrency]);
    setNewCurrId('');
    setNewCurrName('');
    setNewCurrBuy('');
    setNewCurrSell('');
    setShowAddCurrency(false);
    showToast(`تمت إضافة عملة ${newCurrency.name} بنجاح`);
  };

  const handleDeleteCurrency = (id: string) => {
    if (confirm(`هل أنت متأكد من حذف العملة ${id.toUpperCase()}؟`)) {
      onUpdateCurrencies(currencies.filter(c => c.id !== id));
      showToast('تم حذف العملة من قاعدة البيانات');
    }
  };

  // 2. Franc Pivot Rate Handler
  const handleSaveFrancRate = () => {
    const rate = parseFloat(francInput);
    if (!isNaN(rate) && rate > 0) {
      onUpdateFrancRate(rate);
      setEditingFranc(false);
      showToast(`تم تحديث سعر صرف الفرنك التشادي إلى ${rate} ج.س`);
    }
  };

  // 3. Products Handlers
  const handleToggleStock = (productId: string) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        const nextState = !p.inStock;
        return { ...p, inStock: nextState, isAvailable: nextState };
      }
      return p;
    });
    onUpdateProducts(updated);
    showToast('تم تحديث حالة توفر السلعة فورياً');
  };

  const handleProductPriceChange = (productId: string, newPrice: number) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        return { ...p, price: newPrice };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;

    const categoryArMap: Record<string, string> = {
      sugar: 'السكر',
      flour: 'الدقيق',
      oil: 'الزيوت',
      other: 'أخرى'
    };

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: newProdName.trim(),
      price: parseFloat(newProdPrice) || 0,
      currencySymbol: 'ج.س',
      unit: newProdUnit.trim(),
      category: newProdCategory,
      categoryAr: categoryArMap[newProdCategory] || 'أخرى',
      imageUrl: '',
      image: '',
      isAvailable: true,
      inStock: true,
      whatsappMessage: `أرغب في شراء ${newProdName.trim()}`,
      updatedAt: Date.now()
    };

    onUpdateProducts([...products, newProd]);
    setNewProdName('');
    setNewProdPrice('');
    setShowAddProduct(false);
    showToast(`تمت إضافة سلعة ${newProd.name} بنجاح`);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه السلعة التموينية؟')) {
      onUpdateProducts(products.filter(p => p.id !== id));
      showToast('تم حذف السلعة من المخزون');
    }
  };

  // 4. Urgent Alert Broadcast Handler
  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertText.trim()) return;

    setIsBroadcasting(true);
    try {
      await broadcastSystemAlert(alertTitle, alertText.trim());
      playNotificationSound();
      setAlertText('');
      showToast('تم بث التنبيه الفوري بنجاح إلى جميع هواتف المستخدمين!');
    } catch (err) {
      console.error(err);
      alert('تعذر إرسال التنبيه');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await deleteSystemAlertInDb(id);
      showToast('تم حذف التنبيه');
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Orders Handlers
  const handleOrderStatusChange = (orderId: string, status: 'pending' | 'completed' | 'cancelled') => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status };
      }
      return o;
    });
    onUpdateOrders(updated);
    showToast(`تم تعديل حالة الطلب إلى "${status === 'completed' ? 'تم التنفيذ' : (status === 'cancelled' ? 'ملغي' : 'قيد الانتظار')}"`);
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 font-tajawal select-none pb-16" dir="rtl">
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-2 border border-amber-400 animate-bounce">
          <CheckCircle2 size={18} />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-amber-500/20 px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-lg shadow-lg shadow-amber-500/20">
            بَدَلْ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black tracking-wide text-white">لوحة تحكم المشرف (Badal Admin)</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                أوامر وأدوات التحكم
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>متصل لحظياً بقاعدة بيانات Firestore السحابية</span>
            </div>
          </div>
        </div>

        {/* Global Quick Action: Franc Pivot Rate */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-[#1E293B] border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-xs text-amber-400 font-bold">سعر الفرنك التشادي المرجعي:</span>
            {editingFranc ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={francInput}
                  onChange={e => setFrancInput(e.target.value)}
                  className="w-20 bg-black/60 border border-amber-500/50 rounded px-2 py-0.5 text-xs text-amber-300 font-bold text-center focus:outline-none"
                  autoFocus
                />
                <button 
                  onClick={handleSaveFrancRate}
                  className="bg-amber-500 text-black px-2 py-0.5 rounded text-xs font-bold hover:bg-amber-400"
                >
                  حفظ
                </button>
                <button 
                  onClick={() => setEditingFranc(false)}
                  className="text-slate-400 hover:text-white text-xs px-1"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-300">{currentFrancRate} ج.س</span>
                <button
                  onClick={() => { setFrancInput(currentFrancRate.toString()); setEditingFranc(true); }}
                  className="text-[11px] text-slate-400 hover:text-amber-400 underline font-medium"
                >
                  تعديل
                </button>
              </div>
            )}
          </div>

          {/* Download App ZIP Button */}
          <a
            href="/badal_mobile_app.zip"
            download="badal_mobile_app.zip"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            title="تنزيل مجلد تطبيق فلاتر كاملاً بصيغة ZIP"
          >
            <Download size={15} />
            <span>تنزيل ملفات التطبيق (ZIP)</span>
          </a>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
          >
            <Lock size={14} />
            <span>قفل اللوحة</span>
          </button>
        </div>
      </header>

      {/* Control Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('currencies')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'currencies'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0F172A] text-slate-300 hover:bg-[#1E293B] border border-slate-800'
            }`}
          >
            <Coins size={16} />
            <span>التحكم بأسعار الصرف ({currencies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0F172A] text-slate-300 hover:bg-[#1E293B] border border-slate-800'
            }`}
          >
            <Package size={16} />
            <span>السلع والمخزون ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap relative ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0F172A] text-slate-300 hover:bg-[#1E293B] border border-slate-800'
            }`}
          >
            <ShoppingBag size={16} />
            <span>طلبات الشراء الحية</span>
            {pendingOrdersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0F172A] text-slate-300 hover:bg-[#1E293B] border border-slate-800'
            }`}
          >
            <Bell size={16} />
            <span>بث التنبيهات الفورية</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'whatsapp'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0F172A] text-slate-300 hover:bg-[#1E293B] border border-slate-800'
            }`}
          >
            <PhoneCall size={16} />
            <span>أرقام الدعم وواتساب</span>
          </button>

          <button
            onClick={() => setActiveTab('flutter')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap mr-auto ${
              activeTab === 'flutter'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-[#0F172A] text-blue-400 hover:bg-[#1E293B] border border-blue-500/30'
            }`}
          >
            <Smartphone size={16} />
            <span>تطبيق فلاتر للهواتف (Flutter App)</span>
          </button>
        </div>

        {/* Tab 1: Currencies Manager */}
        {activeTab === 'currencies' && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Coins className="text-amber-400" size={20} />
                  <span>جدول التحكم بأسعار الصرف في السوق الموازي</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  أي تعديل في خانة الشراء أو البيع يحفظ فوراً في Firestore وينعكس لحظياً على تطبيق فلاتر لكافة المستخدمين.
                </p>
              </div>

              <button
                onClick={() => setShowAddCurrency(true)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/15"
              >
                <Plus size={16} />
                <span>إضافة عملة جديدة</span>
              </button>
            </div>

            {/* Currencies Matrix Table */}
            <div className="bg-[#0F172A] rounded-2xl border border-amber-500/20 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-[#1E293B] border-b border-slate-800 text-xs text-slate-300 font-bold">
                      <th className="py-3.5 px-4">كود العملة</th>
                      <th className="py-3.5 px-4">اسم العملة</th>
                      <th className="py-3.5 px-4 text-emerald-400">سعر الشراء (ج.س)</th>
                      <th className="py-3.5 px-4 text-amber-400">سعر البيع (ج.س)</th>
                      <th className="py-3.5 px-4 text-center">مؤشر الاتجاه</th>
                      <th className="py-3.5 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {currencies.map(curr => (
                      <tr key={curr.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-black text-amber-400">
                          {curr.id.toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {curr.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              defaultValue={curr.buyPrice}
                              onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val !== curr.buyPrice) {
                                  handlePriceChange(curr.id, 'buyPrice', val);
                                  showToast(`تم تحديث سعر شراء ${curr.name} إلى ${val} ج.س`);
                                }
                              }}
                              className="w-32 bg-black/60 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                            />
                            <span className="text-xs text-slate-400">ج.س</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              defaultValue={curr.sellPrice}
                              onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val !== curr.sellPrice) {
                                  handlePriceChange(curr.id, 'sellPrice', val);
                                  showToast(`تم تحديث سعر بيع ${curr.name} إلى ${val} ج.س`);
                                }
                              }}
                              className="w-32 bg-black/60 border border-amber-500/40 rounded-lg px-2.5 py-1 text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-xs text-slate-400">ج.س</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleTrend(curr.id)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                              curr.change === 'up'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : (curr.change === 'down'
                                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                                  : 'bg-slate-700/40 text-slate-300 border-slate-600 hover:bg-slate-700/60')
                            }`}
                          >
                            {curr.change === 'up' && <TrendingUp size={13} />}
                            {curr.change === 'down' && <TrendingDown size={13} />}
                            {curr.change === 'stable' && <Minus size={13} />}
                            <span>{curr.change === 'up' ? 'صاعد' : (curr.change === 'down' ? 'هابط' : 'مستقر')}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteCurrency(curr.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="حذف العملة"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Currency Modal */}
            {showAddCurrency && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0F172A] border border-amber-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-amber-400">إضافة عملة جديدة</h3>
                    <button onClick={() => setShowAddCurrency(false)} className="text-slate-400 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={handleAddCurrency} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-300 font-bold mb-1">رمز العملة (مثل USD, QAR, KWD)</label>
                      <input
                        type="text"
                        value={newCurrId}
                        onChange={e => setNewCurrId(e.target.value)}
                        placeholder="USD"
                        className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 font-bold mb-1">اسم العملة باللغة العربية</label>
                      <input
                        type="text"
                        value={newCurrName}
                        onChange={e => setNewCurrName(e.target.value)}
                        placeholder="الدولار الأمريكي"
                        className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-emerald-400 font-bold mb-1">سعر الشراء (ج.س)</label>
                        <input
                          type="number"
                          value={newCurrBuy}
                          onChange={e => setNewCurrBuy(e.target.value)}
                          placeholder="2700"
                          className="w-full bg-black/50 border border-emerald-500/40 rounded-xl px-3 py-2 text-sm text-emerald-300 font-bold focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-amber-400 font-bold mb-1">سعر البيع (ج.س)</label>
                        <input
                          type="number"
                          value={newCurrSell}
                          onChange={e => setNewCurrSell(e.target.value)}
                          placeholder="2720"
                          className="w-full bg-black/50 border border-amber-500/40 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl font-bold text-sm"
                      >
                        إضافة العملة وحفظها في Firestore
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCurrency(false)}
                        className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-sm"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Commodities & Stock Control */}
        {activeTab === 'products' && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="text-amber-400" size={20} />
                  <span>التحكم بأسعار السلع التموينية وحالة المخزون</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  تعديل أسعار الجملة، وحدات القياس، والتبديل المباشر بين (متوفر بالمخزون / نفذت الكمية).
                </p>
              </div>

              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/15"
              >
                <Plus size={16} />
                <span>إضافة سلعة تموينية جديدة</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(prod => (
                <div
                  key={prod.id}
                  className={`bg-[#0F172A] border rounded-2xl p-5 shadow-xl transition-all ${
                    prod.inStock ? 'border-amber-500/20' : 'border-rose-500/30 bg-rose-950/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base text-white">{prod.name}</h3>
                      <span className="text-xs text-slate-400 font-medium">الوحدة: {prod.unit}</span>
                    </div>

                    <button
                      onClick={() => handleToggleStock(prod.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                        prod.inStock
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                      }`}
                    >
                      {prod.inStock ? 'متوفر بالمخزون' : 'نفذت الكمية'}
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block mb-1">السعر الحالي (ج.س)</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          defaultValue={prod.price}
                          onBlur={e => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== prod.price) {
                              handleProductPriceChange(prod.id, val);
                              showToast(`تم تحديث سعر ${prod.name} إلى ${val} ج.س`);
                            }
                          }}
                          className="w-28 bg-black/60 border border-amber-500/40 rounded-lg px-2.5 py-1 text-sm text-amber-300 font-bold focus:outline-none"
                        />
                        <span className="text-xs text-slate-400">ج.س</span>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-xs text-slate-400 block mb-1">المقابل بالفرنك</span>
                      <span className="text-sm font-black text-slate-300">
                        {currentFrancRate > 0 ? Math.round(prod.price / currentFrancRate).toLocaleString() : 0} فرنك
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span className="capitalize">القسم: {prod.category}</span>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Product Modal */}
            {showAddProduct && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0F172A] border border-amber-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-amber-400">إضافة سلعة تموينية جديدة</h3>
                    <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-300 font-bold mb-1">اسم السلعة</label>
                      <input
                        type="text"
                        value={newProdName}
                        onChange={e => setNewProdName(e.target.value)}
                        placeholder="مثال: سكر كنانة مستورد"
                        className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-amber-400 font-bold mb-1">السعر (ج.س)</label>
                        <input
                          type="number"
                          value={newProdPrice}
                          onChange={e => setNewProdPrice(e.target.value)}
                          placeholder="33000"
                          className="w-full bg-black/50 border border-amber-500/40 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300 font-bold mb-1">وحدة القياس</label>
                        <input
                          type="text"
                          value={newProdUnit}
                          onChange={e => setNewProdUnit(e.target.value)}
                          placeholder="جوال 50 كجم"
                          className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 font-bold mb-1">القسم</label>
                      <select
                        value={newProdCategory}
                        onChange={e => setNewProdCategory(e.target.value as any)}
                        className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="sugar">السكر</option>
                        <option value="flour">الدقيق</option>
                        <option value="oil">الزيوت</option>
                        <option value="other">سلع أخرى</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl font-bold text-sm"
                      >
                        إضافة السلعة للمخزون
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddProduct(false)}
                        className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-sm"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Urgent Alerts Broadcast */}
        {activeTab === 'alerts' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Broadcast Form */}
            <div className="lg:col-span-1 bg-[#0F172A] border border-amber-500/20 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-bold text-amber-400 flex items-center gap-2 mb-2">
                <Bell size={18} />
                <span>أداة بث التنبيهات الفورية</span>
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                أي رسالة ترسلها هنا ستظهر فوراً مع نغمة رنين مباشرة على هواتف كافة المستخدمين لتطبيق فلاتر.
              </p>

              <form onSubmit={handleBroadcastAlert} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-300 font-bold mb-1">عنوان التنبيه</label>
                  <input
                    type="text"
                    value={alertTitle}
                    onChange={e => setAlertTitle(e.target.value)}
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-bold mb-1">نص الرسالة أو التحديث السعري العاجل</label>
                  <textarea
                    rows={4}
                    value={alertText}
                    onChange={e => setAlertText(e.target.value)}
                    placeholder="مثال: تم تحديث سعر الفرنك التشادي الآن في السوق الموازي ليكون 5900 ج.س."
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Send size={16} />
                  <span>{isBroadcasting ? 'جاري البث الفوري...' : 'بث التنبيه الآن لجميع الهواتف'}</span>
                </button>
              </form>
            </div>

            {/* Existing Alerts List */}
            <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-bold text-white mb-4 flex items-center justify-between">
                <span>سجل التنبيهات المرسلة ({systemAlerts.length})</span>
                <span className="text-xs text-slate-400">تزامن فوري</span>
              </h2>

              {systemAlerts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  لا توجد تنبيهات عاجلة مسجلة حالياً
                </div>
              ) : (
                <div className="space-y-3">
                  {systemAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="bg-black/40 border border-slate-800 hover:border-amber-500/30 rounded-xl p-4 flex items-start justify-between gap-4 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Bell size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-amber-300">{alert.title}</h4>
                            <span className="text-[10px] text-slate-500 font-mono">{alert.time}</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.text}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                        title="حذف التنبيه"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Live Orders Inbox */}
        {activeTab === 'orders' && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="text-amber-400" size={20} />
                  <span>صندوق طلبات الشراء المستلمة من تطبيق فلاتر</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  تصل طلبات الزبائن مباشرة في نفس اللحظة التي يضغط فيها العميل على "طلب شراء" في هاتفه.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">إجمالي الطلبات: {orders.length}</span>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">لا توجد طلبات شراء واردة حتى الآن</p>
                <p className="text-xs text-slate-500 mt-1">ستظهر طلبات الزبائن هنا فور إرسالها من تطبيق فلاتر</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="bg-[#0F172A] border border-slate-800 hover:border-amber-500/30 rounded-2xl p-5 shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500">{order.id}</span>
                        <h4 className="font-bold text-base text-white mt-0.5">{order.productName}</h4>
                        <div className="text-xs text-amber-400 font-bold mt-1">
                          {order.price} ج.س • {order.unit}
                        </div>
                      </div>

                      <select
                        value={order.status}
                        onChange={e => handleOrderStatusChange(order.id, e.target.value as any)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border focus:outline-none ${
                          order.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : (order.status === 'cancelled'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30')
                        }`}
                      >
                        <option value="pending" className="bg-slate-900 text-amber-400">قيد الانتظار</option>
                        <option value="completed" className="bg-slate-900 text-emerald-400">تم التنفيذ</option>
                        <option value="cancelled" className="bg-slate-900 text-rose-400">ملغي</option>
                      </select>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">اسم العميل:</span>
                        <span className="font-bold text-white">{order.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">رقم الهاتف:</span>
                        <span className="font-mono font-bold text-amber-300" dir="ltr">{order.customerPhone}</span>
                      </div>
                      {order.notes && (
                        <div className="bg-black/30 p-2 rounded-lg mt-2 text-slate-300">
                          <span className="text-slate-500 block text-[10px] mb-0.5">ملاحظات العميل:</span>
                          {order.notes}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <PhoneCall size={12} />
                        <span>اتصال بالعميل</span>
                      </a>
                      <a
                        href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً ${order.customerName}، بخصوص طلبك (${order.productName}) عبر تطبيق بَدَلْ...`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <MessageCircle size={12} />
                        <span>محادثة واتساب</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: WhatsApp Config */}
        {activeTab === 'whatsapp' && (
          <div className="mt-6 max-w-2xl bg-[#0F172A] border border-amber-500/20 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2 mb-2">
              <PhoneCall size={18} />
              <span>إدارة أرقام المبيعات والدعم الفني (WhatsApp Config)</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              هذه الأرقام تظهر في تطبيق فلاتر للهواتف وتوجه الزبائن تلقائياً إلى قنوات الدعم والمبيعات.
            </p>

            <form
              onSubmit={e => {
                e.preventDefault();
                onUpdateWhatsAppConfig(whatsAppConfig);
                showToast('تم حفظ أرقام الدعم في Firestore بنجاح');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1">هاتف المبيعات الرئيسي 1</label>
                <input
                  type="text"
                  value={whatsAppConfig.salesPhone1}
                  onChange={e => onUpdateWhatsAppConfig({ ...whatsAppConfig, salesPhone1: e.target.value })}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1">هاتف المبيعات الثانوي 2</label>
                <input
                  type="text"
                  value={whatsAppConfig.salesPhone2}
                  onChange={e => onUpdateWhatsAppConfig({ ...whatsAppConfig, salesPhone2: e.target.value })}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1">هاتف الدعم الفني والاستفسارات</label>
                <input
                  type="text"
                  value={whatsAppConfig.supportPhone}
                  onChange={e => onUpdateWhatsAppConfig({ ...whatsAppConfig, supportPhone: e.target.value })}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1">رابط مباشر لواتساب</label>
                <input
                  type="text"
                  value={whatsAppConfig.waLink}
                  onChange={e => onUpdateWhatsAppConfig({ ...whatsAppConfig, waLink: e.target.value })}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl font-bold text-sm shadow-md shadow-amber-500/20"
              >
                حفظ التعديلات في قاعدة البيانات
              </button>
            </form>
          </div>
        )}

        {/* Tab 6: Flutter Mobile App Package & Build with GitHub Actions */}
        {activeTab === 'flutter' && (
          <div className="mt-6 space-y-6">
            {/* Header Card */}
            <div className="bg-[#0F172A] border border-blue-500/30 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Smartphone size={28} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">مشروع تطبيق فلاتر للهواتف المحمولة (Flutter & Dart App)</h2>
                    <p className="text-xs text-slate-400">
                      مشروع هاتف محمول كامل ونقي بلغة Dart و Flutter Framework منسق وجاهز للبناء التلقائي بواسطة GitHub.com عبر GitHub Actions وتوليد ملف APK.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    جاهز للبناء على GitHub Actions
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/30">
                    Dart & Flutter 100%
                  </span>
                </div>
              </div>

              {/* Direct ZIP Download Hero Box */}
              <div className="bg-[#1E293B] border-2 border-amber-500/50 hover:border-amber-400 rounded-2xl p-6 my-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <h3 className="text-base font-black text-amber-300">حزمة ملفات المشروع كاملة ومضغوطة (badal_mobile_app.zip)</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    تحتوي على كامل مسارات Dart وفلاتر، مجلد Android، ملف التهيئة google-services.json، سير عمل GitHub Actions، وجميع الشاشات والنماذج متطابقة وجاهزة للاستخراج والبناء المباشر.
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                    <span>حجم الملف: ~33 كيلوبايت</span>
                    <span>•</span>
                    <span>عدد الملفات: 28 ملفاً منسقاً</span>
                    <span>•</span>
                    <span className="text-emerald-400">صيغة ZIP قياسية</span>
                  </div>
                </div>

                <a
                  href="/badal_mobile_app.zip"
                  download="badal_mobile_app.zip"
                  className="flex items-center gap-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black px-6 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-amber-500/25 transition-transform hover:scale-105 active:scale-95"
                >
                  <Download size={20} />
                  <span>تنزيل الملفات الآن (Download ZIP)</span>
                </a>
              </div>

              {/* GitHub CI/CD Highlight Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-emerald-500/10 border border-amber-500/30 rounded-xl p-5 my-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ExternalLink size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-amber-300 text-sm">بناء ملف APK تلقائياً عبر GitHub Actions (بدون تثبيت أي برامج على جهازك!)</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      تم إنشاء ملف سير العمل <code className="bg-black/50 px-2 py-0.5 rounded text-amber-400 font-mono">.github/workflows/build_apk.yml</code> ومجلد أندرويد بالكامل مع الشهادات والمكتبات. بمجرد رفع هذا المجلد إلى مستودع GitHub جديد، ستقوم خوادم GitHub بتجميع الكود وبناء ملف <code className="bg-black/50 px-2 py-0.5 rounded text-emerald-400 font-mono">app-release.apk</code> جاهز للتحميل والتثبيت خلال 3 دقائق فقط!
                    </p>
                  </div>
                </div>
              </div>

              {/* Step-by-Step GitHub Push Guide */}
              <div className="bg-[#030712] border border-slate-800 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-4">
                  <Terminal size={16} className="text-amber-400" />
                  <span>خطوات رفع المشروع إلى GitHub.com وتشغيل البناء التلقائي:</span>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/60 p-4 rounded-xl border border-slate-900">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-bold text-amber-400">الخطوة 1: تهيئة المستودع وإضافة الملفات</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText('cd badal_mobile_app\ngit init\ngit add .\ngit commit -m "Initial commit - Badal Flutter Mobile App"');
                          showToast('تم نسخ أوامر الخطوة 1');
                        }}
                        className="text-slate-400 hover:text-white text-[11px] bg-slate-800 px-2.5 py-1 rounded transition-colors"
                      >
                        نسخ الأوامر
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre p-2 bg-black/40 rounded border border-slate-800/60" dir="ltr">
{`cd badal_mobile_app
git init
git add .
git commit -m "Initial commit - Badal Flutter Mobile App"`}
                    </pre>
                  </div>

                  <div className="bg-black/60 p-4 rounded-xl border border-slate-900">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-bold text-blue-400">الخطوة 2: ربط المستودع بموقع GitHub والرفع</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText('git branch -M main\ngit remote add origin https://github.com/USERNAME/badal_mobile_app.git\ngit push -u origin main');
                          showToast('تم نسخ أوامر الخطوة 2 (استبدل USERNAME باسم حسابك)');
                        }}
                        className="text-slate-400 hover:text-white text-[11px] bg-slate-800 px-2.5 py-1 rounded transition-colors"
                      >
                        نسخ الأوامر
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre p-2 bg-black/40 rounded border border-slate-800/60" dir="ltr">
{`git branch -M main
# استبدل USERNAME باسم مستخدم GitHub الخاص بك:
git remote add origin https://github.com/USERNAME/badal_mobile_app.git
git push -u origin main`}
                    </pre>
                  </div>

                  <div className="bg-black/60 p-4 rounded-xl border border-slate-900">
                    <span className="font-bold text-emerald-400 text-xs block mb-2">الخطوة 3: استلام وتحميل ملف APK النهائي</span>
                    <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed">
                      <li>افتح صفحة المستودع الخاص بك على <b className="text-white">GitHub.com</b>.</li>
                      <li>اضغط على التبويب <b className="text-amber-300">Actions</b> في القائمة العلوية.</li>
                      <li>ستشاهد سير العمل <b className="text-blue-300">Build Badal Flutter APK</b> قيد التشغيل تلقائياً.</li>
                      <li>بعد اكتمال علامة الصح الخضراء (خلال دقيقتين)، اضغط على اسم العملية.</li>
                      <li>في أسفل الصفحة بقسم <b className="text-emerald-400">Artifacts</b> اضغط على <b className="text-white underline">badal-app-release.apk</b> لتحميل ملف التطبيق مباشرة إلى هاتفك!</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Project Directory Tree Explorer */}
              <div className="bg-black/40 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Package size={16} className="text-amber-400" />
                    <span>المسارات والملفات المنسقة في مجلد <code className="text-amber-400 font-mono">badal_mobile_app/</code>:</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">منسقة ومعتمدة وفق معايير Flutter الرسمية</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">🤖 إعدادات GitHub وأندرويد:</span>
                    <ul className="text-slate-300 space-y-1 text-[11px]">
                      <li>📁 .github/workflows/build_apk.yml</li>
                      <li>📁 android/app/build.gradle</li>
                      <li>📁 android/app/google-services.json</li>
                      <li>📁 android/app/src/main/AndroidManifest.xml</li>
                      <li>📁 android/settings.gradle</li>
                      <li>📁 android/build.gradle</li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-blue-400 font-bold block mb-1">📱 كود الشاشات والنواة (Dart):</span>
                    <ul className="text-slate-300 space-y-1 text-[11px]">
                      <li>📄 lib/main.dart (نقطة الدخول)</li>
                      <li>📄 lib/theme/app_theme.dart (الثيم الفاخر)</li>
                      <li>📄 lib/services/firestore_service.dart (تزامن Firestore)</li>
                      <li>📄 lib/screens/home_screen.dart (الشاشة الرئيسية)</li>
                      <li>📄 lib/screens/rates_screen.dart (جدول الأسعار)</li>
                      <li>📄 lib/screens/products_screen.dart (السلع والطلب)</li>
                      <li>📄 lib/screens/alerts_screen.dart (التنبيهات الفورية)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Local Build Commands (Optional) */}
              <div className="mt-4 bg-[#030712] border border-slate-800 rounded-xl p-4">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">أوامر البناء المحلي المباشر لمن يملك Flutter SDK مثبت على جهازه:</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="bg-black/50 p-2.5 rounded border border-slate-900">
                    <span className="text-slate-500 block text-[10px]"># تثبيت الحزم:</span>
                    <span className="text-amber-300">flutter pub get</span>
                  </div>
                  <div className="bg-black/50 p-2.5 rounded border border-slate-900">
                    <span className="text-slate-500 block text-[10px]"># تشغيل التطبيق:</span>
                    <span className="text-emerald-300">flutter run</span>
                  </div>
                  <div className="bg-black/50 p-2.5 rounded border border-slate-900">
                    <span className="text-slate-500 block text-[10px]"># بناء APK محلياً:</span>
                    <span className="text-blue-300">flutter build apk --release</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
