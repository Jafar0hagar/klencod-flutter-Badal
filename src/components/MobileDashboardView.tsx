import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  Package, 
  Coins, 
  ShoppingBag, 
  Bell, 
  PhoneCall, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  MessageCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Users,
  Truck,
  Volume2,
  KeyRound,
  Warehouse
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Currency, Product, Order, WhatsAppConfig, SystemAlert, AdminUser, Supplier } from '../types';
import { db, broadcastSystemAlert, deleteSystemAlertInDb, AuthSessionUser, hashString, sanitizeDbData } from '../utils/firebase';
import { playNotificationSound } from '../utils/audio';

interface MobileDashboardViewProps {
  currentUser?: AuthSessionUser | null;
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
  onBackToSettings?: () => void;
  onLogout?: () => void;
  isDarkMode?: boolean;
  language?: 'ar' | 'en';
}

export default function MobileDashboardView({
  currentUser,
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
  onBackToSettings,
  onLogout,
  isDarkMode,
  language
}: MobileDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'currencies' | 'products' | 'alerts' | 'whatsapp' | 'team'>('currencies');

  // Team Supervisors & Suppliers State
  const [teamSupervisors, setTeamSupervisors] = useState<AdminUser[]>([]);
  const [teamSuppliers, setTeamSuppliers] = useState<Supplier[]>([]);
  const [teamTab, setTeamTab] = useState<'supervisors' | 'suppliers'>('supervisors');

  // Supervisor creation state
  const [showAddSupervisorModal, setShowAddSupervisorModal] = useState(false);
  const [newSupvId, setNewSupvId] = useState(`SUPV-${Math.floor(100 + Math.random() * 900)}`);
  const [newSupvName, setNewSupvName] = useState('');
  const [newSupvPhone, setNewSupvPhone] = useState('+249');
  const [newSupvPin, setNewSupvPin] = useState('');
  const [supvPinError, setSupvPinError] = useState<string | null>(null);

  // Supplier creation state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSuppId, setNewSuppId] = useState(`SUP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppPhone, setNewSuppPhone] = useState('+249');
  const [newSuppWarehouse, setNewSuppWarehouse] = useState('الخرطوم - المستودع المركزي');
  const [newSuppAssigned, setNewSuppAssigned] = useState('سكر، دقيق، زيت طعام');
  const [newSuppPin, setNewSuppPin] = useState('');
  const [suppPinError, setSuppPinError] = useState<string | null>(null);

  const [userToDelete, setUserToDelete] = useState<{ type: 'supervisor' | 'supplier'; id: string; name: string } | null>(null);
  const [audioPlayedToast, setAudioPlayedToast] = useState<string | null>(null);

  // Sync supervisors and suppliers from Firestore
  useEffect(() => {
    const unsubSupervisors = onSnapshot(collection(db, 'adminUsers'), (snap) => {
      const list: AdminUser[] = [];
      snap.forEach(d => list.push(d.data() as AdminUser));
      setTeamSupervisors(list);
    }, (err) => console.warn('Sync supervisors error:', err));

    const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snap) => {
      const list: Supplier[] = [];
      snap.forEach(d => list.push(d.data() as Supplier));
      setTeamSuppliers(list);
    }, (err) => console.warn('Sync suppliers error:', err));

    return () => {
      unsubSupervisors();
      unsubSuppliers();
    };
  }, []);

  // Search & Filters
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals / Dialogs
  const [showClearOrdersConfirm, setShowClearOrdersConfirm] = useState<boolean>(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Currency quick edit state
  const [editingCurrencyId, setEditingCurrencyId] = useState<string | null>(null);
  const [tempBuyPrice, setTempBuyPrice] = useState<number>(0);
  const [tempSellPrice, setTempSellPrice] = useState<number>(0);
  const [showAddCurrencyModal, setShowAddCurrencyModal] = useState<boolean>(false);
  const [newCurrencyName, setNewCurrencyName] = useState<string>('');
  const [newCurrencyCode, setNewCurrencyCode] = useState<string>('');
  const [newCurrencyBuy, setNewCurrencyBuy] = useState<string>('');
  const [newCurrencySell, setNewCurrencySell] = useState<string>('');

  // Product quick edit state
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdPrice, setNewProdPrice] = useState<string>('');
  const [newProdUnit, setNewProdUnit] = useState<string>('جوال ٥٠ كجم');
  const [newProdCategory, setNewProdCategory] = useState<'sugar' | 'foodstuffs' | 'oils' | 'rice' | 'other'>('sugar');

  // Franc Rate edit state
  const [editingFranc, setEditingFranc] = useState<boolean>(false);
  const [tempFrancRate, setTempFrancRate] = useState<string>(currentFrancRate.toString());

  // Alerts Broadcast state
  const [alertTitle, setAlertTitle] = useState<string>('');
  const [alertText, setAlertText] = useState<string>('');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [alertSuccessToast, setAlertSuccessToast] = useState<string | null>(null);

  // WhatsApp Config state
  const [sales1, setSales1] = useState(whatsAppConfig.salesPhone1 || '');
  const [sales2, setSales2] = useState(whatsAppConfig.salesPhone2 || '');
  const [supportP, setSupportP] = useState(whatsAppConfig.supportPhone || '');
  const [groupL, setGroupL] = useState(whatsAppConfig.groupLink || '');
  const [channelL, setChannelL] = useState(whatsAppConfig.channelLink || '');
  const [savedWaToast, setSavedWaToast] = useState(false);

  // Pending orders count
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const matchesFilter = orderFilter === 'all' ? true : o.status === orderFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesFilter;
    const matchesSearch = 
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.productName.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // Actions
  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    onUpdateOrders(updated);
  };

  const handleDeleteSingleOrder = (orderId: string) => {
    const updated = orders.filter(o => o.id !== orderId);
    onUpdateOrders(updated);
    setOrderToDelete(null);
  };

  const handleClearAllOrders = () => {
    onUpdateOrders([]);
    setShowClearOrdersConfirm(false);
  };

  const handleBroadcastAlert = async () => {
    if (!alertTitle.trim() || !alertText.trim()) return;
    setIsBroadcasting(true);
    try {
      const newAlert = await broadcastSystemAlert(alertTitle.trim(), alertText.trim());
      playNotificationSound(1, 'urgent_alert');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('badal:trigger_alert', {
          detail: { title: alertTitle.trim(), text: alertText.trim(), id: newAlert.id }
        }));
      }
      setAlertSuccessToast('✅ تم بث التنبيه الفوري بنجاح إلى جميع العملاء وتحديث السحابة فورا');
      setTimeout(() => setAlertSuccessToast(null), 3500);
      setAlertTitle('');
      setAlertText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    await deleteSystemAlertInDb(id);
  };

  const handleSaveFrancRate = () => {
    const rate = parseFloat(tempFrancRate);
    if (!isNaN(rate) && rate > 0) {
      onUpdateFrancRate(rate);
      setEditingFranc(false);
    }
  };

  const handleSaveCurrencyPrice = (c: Currency) => {
    const updated = currencies.map(item => {
      if (item.id === c.id) {
        return {
          ...item,
          price: tempSellPrice,
          buyPrice: tempBuyPrice,
          lastUpdated: 'الآن'
        };
      }
      return item;
    });
    onUpdateCurrencies(updated as any);
    setEditingCurrencyId(null);
  };

  const handleToggleProductStock = (p: Product) => {
    const updated = products.map(item => {
      if (item.id === p.id) {
        return { ...item, isAvailable: !item.isAvailable };
      }
      return item;
    });
    onUpdateProducts(updated);
  };

  const handleDeleteProduct = (prodId: string) => {
    const updated = products.filter(p => p.id !== prodId);
    onUpdateProducts(updated);
  };

  const handleAddNewProduct = () => {
    if (!newProdName.trim() || !newProdPrice.trim()) return;
    const newP: Product = {
      id: `prod-${Date.now()}`,
      name: newProdName.trim(),
      price: parseFloat(newProdPrice) || 0,
      currencySymbol: 'ج.س',
      category: newProdCategory,
      categoryAr: newProdCategory === 'sugar' ? 'السكر' : (newProdCategory === 'rice' ? 'الأرز' : (newProdCategory === 'oils' ? 'الزيوت' : 'مواد غذائية')),
      imageUrl: '',
      isAvailable: true,
      unit: newProdUnit.trim(),
      whatsappMessage: `السلام عليكم، أرغب في طلب ${newProdName.trim()}.`
    };
    onUpdateProducts([...products, newP]);
    setNewProdName('');
    setNewProdPrice('');
    setShowAddProductModal(false);
  };

  const handleAddNewCurrency = () => {
    if (!newCurrencyName.trim() || !newCurrencyCode.trim()) return;
    const newC: Currency = {
      id: `curr-${Date.now()}`,
      name: newCurrencyName.trim(),
      code: newCurrencyCode.trim().toUpperCase(),
      symbol: newCurrencyCode.trim().toUpperCase(),
      price: parseFloat(newCurrencySell) || 0,
      lastUpdated: 'الآن',
      flag: '🌐',
      trend: 'stable',
      country: newCurrencyName.trim()
    };
    onUpdateCurrencies([...currencies, newC]);
    setNewCurrencyName('');
    setNewCurrencyCode('');
    setNewCurrencyBuy('');
    setNewCurrencySell('');
    setShowAddCurrencyModal(false);
  };

  const handleSaveWhatsAppConfig = () => {
    onUpdateWhatsAppConfig({
      ...whatsAppConfig,
      salesPhone1: sales1,
      salesPhone2: sales2,
      supportPhone: supportP,
      groupLink: groupL,
      channelLink: channelL
    });
    setSavedWaToast(true);
    setTimeout(() => setSavedWaToast(false), 2500);
  };

  // Create new supervisor with strictly 8-digit PIN
  const handleCreateSupervisor = async () => {
    setSupvPinError(null);
    const cleanPin = newSupvPin.trim();
    if (cleanPin.length !== 8 || !/^\d+$/.test(cleanPin)) {
      setSupvPinError('يجب أن يتكون رمز الأمان (PIN) من ٨ أرقام حصراً.');
      return;
    }
    if (!newSupvName.trim() || !newSupvId.trim()) {
      setSupvPinError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    try {
      const hashed = await hashString(cleanPin);
      const newAdminUser: AdminUser = {
        id: newSupvId.trim().toUpperCase(),
        name: newSupvName.trim(),
        email: `${newSupvId.trim().toLowerCase()}@badal.com`,
        role: 'supervisor',
        pin: cleanPin,
        hashedPassword: hashed,
        phone: newSupvPhone.trim(),
        whatsappPhone: newSupvPhone.trim()
      };

      await setDoc(doc(db, 'adminUsers', newAdminUser.id), sanitizeDbData(newAdminUser));
      setShowAddSupervisorModal(false);
      setNewSupvName('');
      setNewSupvPin('');
      setNewSupvId(`SUPV-${Math.floor(100 + Math.random() * 900)}`);
      playNotificationSound(1, 'price_updated');
    } catch (err) {
      setSupvPinError('حدث خطأ أثناء حفظ المشرف في السحابة.');
    }
  };

  // Create new supplier with strictly 8-digit PIN
  const handleCreateSupplier = async () => {
    setSuppPinError(null);
    const cleanPin = newSuppPin.trim();
    if (cleanPin.length !== 8 || !/^\d+$/.test(cleanPin)) {
      setSuppPinError('يجب أن يتكون رمز الأمان (PIN) من ٨ أرقام حصراً.');
      return;
    }
    if (!newSuppName.trim() || !newSuppId.trim()) {
      setSuppPinError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    try {
      const newSupplier: Supplier = {
        id: newSuppId.trim().toUpperCase(),
        name: newSuppName.trim(),
        phone: newSuppPhone.trim(),
        pin: cleanPin,
        warehouseAddress: newSuppWarehouse.trim(),
        assignedProducts: newSuppAssigned.split(/[,،]/).map(s => s.trim()).filter(Boolean),
        status: 'active',
        createdAt: Date.now()
      };

      await setDoc(doc(db, 'suppliers', newSupplier.id), sanitizeDbData(newSupplier));
      setShowAddSupplierModal(false);
      setNewSuppName('');
      setNewSuppPin('');
      setNewSuppId(`SUP-${Math.floor(1000 + Math.random() * 9000)}`);
      playNotificationSound(1, 'supplier_signal');
    } catch (err) {
      setSuppPinError('حدث خطأ أثناء حفظ المورّد في السحابة.');
    }
  };

  // Delete supervisor or supplier
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      if (userToDelete.type === 'supervisor') {
        await deleteDoc(doc(db, 'adminUsers', userToDelete.id));
      } else {
        await deleteDoc(doc(db, 'suppliers', userToDelete.id));
      }
      setUserToDelete(null);
      playNotificationSound(1, 'order_received');
    } catch (err) {
      console.warn("Delete error:", err);
    }
  };

  const testAudioSignal = (type: string, name: string) => {
    playNotificationSound(1, type);
    setAudioPlayedToast(name);
    setTimeout(() => setAudioPlayedToast(null), 2500);
  };

  return (
    <div 
      className={`w-full h-full flex flex-col select-none ${
        isDarkMode ? 'bg-[#0E0C0A] text-stone-100' : 'bg-[#FAF7F0] text-stone-900'
      }`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Mobile Header */}
      <div className={`shrink-0 px-4 py-3 border-b flex items-center justify-between ${
        isDarkMode 
          ? 'bg-[#181410] border-[#D5A549]/20' 
          : 'bg-white border-stone-200 shadow-2xs'
      }`}>
        <div className="flex items-center gap-2">
          {onBackToSettings && (
            <button
              onClick={onBackToSettings}
              className="p-1.5 rounded-lg bg-stone-500/15 text-stone-300 hover:text-white transition-all flex items-center gap-1 text-[10px] font-tajawal active:scale-95 border border-stone-500/20"
              title="الرجوع للإعدادات"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>الإعدادات</span>
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FAF1D6] to-[#EBC173] flex items-center justify-center border border-[#D5A549]/40 text-[#850F1D] shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-black text-amber-500 font-cairo">بَدَلْ • الإدارة</h2>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">حيّ</span>
            </div>
            <p className="text-[9px] text-stone-400 font-tajawal">لوحة تحكم المشرفين المباشرة</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 text-[10px] font-black border border-rose-500/30 transition-all active:scale-95"
          title="تسجيل الخروج والعودة للإعدادات"
        >
          <LogOut className="w-3 h-3" />
          <span>خروج</span>
        </button>
      </div>

      {/* Top Mobile Quick Stats Pills */}
      <div className={`shrink-0 px-3 py-2 border-b grid grid-cols-4 gap-1.5 text-center ${
        isDarkMode ? 'bg-[#12100E] border-stone-800/80' : 'bg-stone-50 border-stone-200'
      }`}>
        <div className="p-1.5 rounded-lg bg-stone-500/10 border border-stone-500/15">
          <p className="text-[8px] text-stone-400 font-tajawal">العملات</p>
          <p className="text-xs font-black text-emerald-400">{currencies.length}</p>
        </div>
        <div className="p-1.5 rounded-lg bg-stone-500/10 border border-stone-500/15">
          <p className="text-[8px] text-stone-400 font-tajawal">سعر الفرنك</p>
          <p className="text-xs font-black text-amber-300">{currentFrancRate}</p>
        </div>
        <div className="p-1.5 rounded-lg bg-stone-500/10 border border-stone-500/15">
          <p className="text-[8px] text-stone-400 font-tajawal">السلع والمنتجات</p>
          <p className="text-xs font-black text-amber-400">{products.length}</p>
        </div>
        <div className="p-1.5 rounded-lg bg-stone-500/10 border border-stone-500/15">
          <p className="text-[8px] text-stone-400 font-tajawal">التنبيهات</p>
          <p className="text-xs font-black text-rose-400">{systemAlerts.length}</p>
        </div>
      </div>

      {/* Horizontal Scrollable Mobile Tab Selector */}
      <div className={`shrink-0 px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar ${
        isDarkMode ? 'bg-[#15120F] border-stone-800' : 'bg-white border-stone-200'
      }`}>
        <button
          onClick={() => setActiveTab('currencies')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition-all ${
            activeTab === 'currencies'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-stone-500/10 text-stone-400 hover:text-stone-200'
          }`}
        >
          <Coins className="w-3 h-3" />
          <span>أسعار العملات والفرنك</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition-all ${
            activeTab === 'products'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-stone-500/10 text-stone-400 hover:text-stone-200'
          }`}
        >
          <ShoppingBag className="w-3 h-3" />
          <span>أسعار السلع والمنتجات</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition-all ${
            activeTab === 'alerts'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-stone-500/10 text-stone-400 hover:text-stone-200'
          }`}
        >
          <Bell className="w-3 h-3" />
          <span>بث تنبيه مباشر</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition-all ${
            activeTab === 'whatsapp'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-stone-500/10 text-stone-400 hover:text-stone-200'
          }`}
        >
          <PhoneCall className="w-3 h-3" />
          <span>أرقام الواتساب</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition-all ${
            activeTab === 'team'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-stone-500/10 text-stone-400 hover:text-stone-200'
          }`}
        >
          <Users className="w-3 h-3" />
          <span>المشرفين</span>
        </button>
      </div>

      {/* Main Tab Content Area (Scrollable Native View) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 pb-20">

        {/* ==================== TAB 1: CURRENCIES & FRANC ==================== */}
        {activeTab === 'currencies' && (
          <div className="space-y-3">
            {/* Prevailing Franc Rate Card */}
            <div className={`p-3 rounded-xl border ${
              isDarkMode 
                ? 'bg-gradient-to-br from-[#1F1912] to-[#141210] border-[#D5A549]/30' 
                : 'bg-white border-amber-300 shadow-2xs'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇹🇩</span>
                  <div>
                    <h3 className="text-xs font-black text-stone-100">سعر الفرنك التشادي السائد</h3>
                    <p className="text-[9px] text-stone-400">سعر الألف فرنك المعتمد لكافة الحسابات</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-sm font-black text-amber-400">{currentFrancRate} ج.س</span>
                </div>
              </div>

              {editingFranc ? (
                <div className="flex items-center gap-1.5 pt-2 border-t border-stone-800">
                  <input 
                    type="number"
                    value={tempFrancRate}
                    onChange={(e) => setTempFrancRate(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-900 border border-amber-500/50 text-white outline-none"
                    placeholder="مثال: 5900"
                  />
                  <button
                    onClick={handleSaveFrancRate}
                    className="px-3 py-1 rounded-lg bg-emerald-500 text-stone-950 text-[10px] font-black"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setEditingFranc(false)}
                    className="px-2 py-1 rounded-lg bg-stone-800 text-stone-400 text-[10px]"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempFrancRate(currentFrancRate.toString());
                    setEditingFranc(true);
                  }}
                  className="w-full mt-1 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 text-[10px] font-bold border border-amber-500/30 flex items-center justify-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>تعديل سعر صرف الفرنك</span>
                </button>
              )}
            </div>

            {/* Header + Add Currency */}
            <div className="flex items-center justify-between pt-1">
              <h4 className="text-xs font-black text-stone-200">العملات المسجلة ({currencies.length})</h4>
              <button
                onClick={() => setShowAddCurrencyModal(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 text-[10px] font-black flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>إضافة عملة</span>
              </button>
            </div>

            {/* Currencies Cards */}
            <div className="space-y-2">
              {currencies.map(c => {
                const isEditing = editingCurrencyId === c.id;
                const buyVal = (c as any).buyPrice || c.price || 0;
                const sellVal = c.price || 0;

                return (
                  <div 
                    key={c.id}
                    className={`p-2.5 rounded-xl border ${
                      isDarkMode ? 'bg-[#181410] border-stone-800' : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.flag || '🪙'}</span>
                        <div>
                          <p className="text-xs font-bold text-stone-100">{c.name}</p>
                          <p className="text-[9px] text-stone-400">{c.code} • {c.country}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (isEditing) {
                              handleSaveCurrencyPrice(c);
                            } else {
                              setEditingCurrencyId(c.id);
                              setTempBuyPrice(buyVal);
                              setTempSellPrice(sellVal);
                            }
                          }}
                          className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                            isEditing 
                              ? 'bg-emerald-500 text-stone-950' 
                              : 'bg-stone-500/15 text-stone-300 hover:text-amber-400'
                          }`}
                        >
                          {isEditing ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                        </button>

                        <button
                          onClick={() => {
                            const updated = currencies.filter(item => item.id !== c.id);
                            onUpdateCurrencies(updated);
                          }}
                          className="p-1.5 rounded-lg text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-stone-800">
                        <div>
                          <label className="text-[8px] text-stone-400 block mb-0.5">سعر الشراء:</label>
                          <input 
                            type="number"
                            value={tempBuyPrice}
                            onChange={(e) => setTempBuyPrice(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-[11px] font-bold rounded bg-stone-900 border border-stone-700 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-stone-400 block mb-0.5">سعر البيع:</label>
                          <input 
                            type="number"
                            value={tempSellPrice}
                            onChange={(e) => setTempSellPrice(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-[11px] font-bold rounded bg-stone-900 border border-stone-700 text-white outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-stone-800/40">
                        <div className="p-1 rounded bg-stone-500/10 text-center">
                          <span className="text-[8px] text-stone-400 block">شراء</span>
                          <span className="font-black text-amber-400">{buyVal} ج.س</span>
                        </div>
                        <div className="p-1 rounded bg-stone-500/10 text-center">
                          <span className="text-[8px] text-stone-400 block">بيع</span>
                          <span className="font-black text-stone-200">{sellVal} ج.س</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: PRODUCTS ==================== */}
        {activeTab === 'products' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-stone-200">السلع التموينية ({products.length})</h4>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 text-[10px] font-black flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>إضافة سلعة</span>
              </button>
            </div>

            <div className="space-y-2">
              {products.map(p => (
                <div 
                  key={p.id}
                  className={`p-2.5 rounded-xl border ${
                    isDarkMode ? 'bg-[#181410] border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-100">{p.name}</span>
                        <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-bold ${
                          p.isAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {p.isAvailable ? 'متوفر' : 'نفذ'}
                        </span>
                      </div>
                      <p className="text-[9px] text-stone-400">{p.unit} • {p.categoryAr || p.category}</p>
                    </div>

                    <div className="text-left shrink-0">
                      <p className="text-xs font-black text-amber-400">{p.price} ج.س</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-stone-800/40">
                    {/* In Stock toggle button */}
                    <button
                      onClick={() => handleToggleProductStock(p)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                        p.isAvailable 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {p.isAvailable ? 'المخزون: متوفر بالمستودع' : 'المخزون: غير متوفر حالياً'}
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 rounded-lg text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: BROADCAST ALERTS ==================== */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-[#181410] border-[#D5A549]/30' : 'bg-white border-stone-200'
            }`}>
              <h4 className="text-xs font-black text-amber-400 mb-1 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                <span>بث إشعار وتنبيه عاجل لكافة العملاء</span>
              </h4>
              <p className="text-[9px] text-stone-400 mb-3">
                يصل هذا الإشعار فوراً إلى هواتف جميع المستخدمين في شاشة التطبيق الرئيسية.
              </p>

              <div className="space-y-2">
                <div>
                  <label className="text-[9px] text-stone-400 block mb-0.5">عنوان التنبيه:</label>
                  <input 
                    type="text"
                    placeholder="مثال: تحديث عاجل لأسعار الصرف"
                    value={alertTitle}
                    onChange={(e) => setAlertTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-stone-400 block mb-0.5">نص التنبيه:</label>
                  <textarea 
                    rows={2}
                    placeholder="مثال: تم تعديل سعر صرف الفرنك التشادي الآن في السوق الموازي ليكون 5900 ج.س."
                    value={alertText}
                    onChange={(e) => setAlertText(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs text-white outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleBroadcastAlert}
                  disabled={isBroadcasting || !alertTitle.trim() || !alertText.trim()}
                  className="w-full py-2 rounded-lg bg-amber-500 text-stone-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 active:scale-98 transition-all cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{isBroadcasting ? 'جاري البث السحابي...' : 'بث التنبيه الفوري الآن'}</span>
                </button>

                {alertSuccessToast && (
                  <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold text-center">
                    {alertSuccessToast}
                  </div>
                )}
              </div>
            </div>

            {/* Audio Signals & Ringtones Testing Section */}
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-[#181410] border-amber-500/20' : 'bg-white border-stone-200'
            }`}>
              <h4 className="text-xs font-black text-amber-400 mb-1 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>إشارات ورنين النظام (Acoustic Signals)</span>
              </h4>
              <p className="text-[9px] text-stone-400 mb-2.5">
                إشارات صوتية رقمية متطورة تُعزف فورياً لدى العملاء والمشرفين عند وصول الطلبات أو تحديثات الأسعار.
              </p>

              {audioPlayedToast && (
                <div className="p-1.5 mb-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold text-center">
                  🔔 تم إطلاق الإشارة الصوتية: {audioPlayedToast}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => testAudioSignal('urgent_alert', 'إشارة تنبيه عاجل')}
                  className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1.5 justify-center active:scale-95 transition-all"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>تنبيه عاجل</span>
                </button>

                <button
                  onClick={() => testAudioSignal('order_received', 'رنين وصول طلب')}
                  className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1.5 justify-center active:scale-95 transition-all"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>رنين استلام طلب</span>
                </button>

                <button
                  onClick={() => testAudioSignal('supplier_signal', 'نبض توريد المستودع')}
                  className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 justify-center active:scale-95 transition-all"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>نبض المستودع</span>
                </button>

                <button
                  onClick={() => testAudioSignal('test', 'رنين لحني نغمي')}
                  className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold flex items-center gap-1.5 justify-center active:scale-95 transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>نغمة متعددة الأوتار</span>
                </button>
              </div>
            </div>

            {/* Active Alerts List */}
            <h4 className="text-xs font-black text-stone-300 pt-2">التنبيهات السابقة ({systemAlerts.length})</h4>
            <div className="space-y-2">
              {systemAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 ${
                    isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div>
                    <h5 className="text-[11px] font-bold text-amber-400">{alert.title}</h5>
                    <p className="text-[9px] text-stone-300 mt-0.5">{alert.text}</p>
                    <span className="text-[8px] text-stone-500 mt-1 block">{alert.time}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 5: TEAM (SUPERVISORS & SUPPLIERS) ==================== */}
        {activeTab === 'team' && (
          <div className="space-y-3">
            {/* Header & Sub-selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800">
                <button
                  onClick={() => setTeamTab('supervisors')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    teamTab === 'supervisors'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  المشرفين ({teamSupervisors.length})
                </button>
                <button
                  onClick={() => setTeamTab('suppliers')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    teamTab === 'suppliers'
                      ? 'bg-emerald-500 text-stone-950 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  الموردين ({teamSuppliers.length})
                </button>
              </div>

              {teamTab === 'supervisors' ? (
                <button
                  onClick={() => {
                    setSupvPinError(null);
                    setShowAddSupervisorModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-[10px] font-black flex items-center gap-1 active:scale-95 shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>إضافة مشرف</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSuppPinError(null);
                    setShowAddSupplierModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-stone-950 text-[10px] font-black flex items-center gap-1 active:scale-95 shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>إضافة مورّد</span>
                </button>
              )}
            </div>

            {/* Content: Supervisors */}
            {teamTab === 'supervisors' && (
              <div className="space-y-2">
                <p className="text-[9px] text-stone-400 font-tajawal px-1">
                  المشرفون يمتلكون صلاحية تعديل أسعار الصرف، أسعار السلع، وبث التنبيهات مع رمز أمان ٨ أرقام.
                </p>

                {teamSupervisors.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-stone-900/50 border border-stone-800">
                    <p className="text-xs text-stone-400">لا يوجد مشرفون مسجلون حالياً</p>
                  </div>
                ) : (
                  teamSupervisors.map(supv => (
                    <div
                      key={supv.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isDarkMode ? 'bg-stone-900/90 border-stone-800' : 'bg-white border-stone-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-stone-100 font-cairo">{supv.name}</h4>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono font-bold">
                                {supv.id}
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-400 font-mono mt-0.5">{supv.phone || 'بدون هاتف'}</p>
                            <div className="flex items-center gap-2 mt-1 text-[9px] text-stone-500">
                              <span className="flex items-center gap-0.5">
                                <KeyRound className="w-2.5 h-2.5 text-amber-400" />
                                PIN: {supv.pin ? '••••••••' : 'مسجل بتشفير'}
                              </span>
                              <span>•</span>
                              <span className="text-emerald-400 font-bold">
                                {supv.role === 'admin_full' ? 'إدارة عامة' : 'مشرف أسعار'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {supv.id !== 'ADM-2026' && (
                          <button
                            onClick={() => setUserToDelete({ type: 'supervisor', id: supv.id, name: supv.name })}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="حذف المشرف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Content: Suppliers */}
            {teamTab === 'suppliers' && (
              <div className="space-y-2">
                <p className="text-[9px] text-stone-400 font-tajawal px-1">
                  الموردون يمتلكون بوابة مخصصة بتنفيذ مختلف لإدارة مخزون السلع الموكلة، تحديث الكميات، وتجهيز شحنات التوريد.
                </p>

                {teamSuppliers.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-stone-900/50 border border-stone-800">
                    <p className="text-xs text-stone-400">لا يوجد موردون مسجلون حالياً</p>
                  </div>
                ) : (
                  teamSuppliers.map(supp => (
                    <div
                      key={supp.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isDarkMode ? 'bg-stone-900/90 border-stone-800' : 'bg-white border-stone-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-stone-100 font-cairo">{supp.name}</h4>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-bold">
                                {supp.id}
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-400 font-mono mt-0.5">{supp.phone}</p>
                            <p className="text-[9px] text-stone-400 mt-0.5 flex items-center gap-1">
                              <Warehouse className="w-3 h-3 text-stone-500" />
                              <span>{supp.warehouseAddress || 'مستودع مركزي'}</span>
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[9px] text-stone-500">
                              <span className="flex items-center gap-0.5">
                                <KeyRound className="w-2.5 h-2.5 text-emerald-400" />
                                PIN: {supp.pin ? '••••••••' : '٨ أرقام'}
                              </span>
                              <span>•</span>
                              <span className="text-emerald-400 font-bold">
                                بوابة توريد مخصصة
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setUserToDelete({ type: 'supplier', id: supp.id, name: supp.name })}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="حذف المورد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 5: WHATSAPP CONFIG ==================== */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-3">
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-[#181410] border-stone-800' : 'bg-white border-stone-200'
            }`}>
              <h4 className="text-xs font-black text-emerald-400 mb-1 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>أرقام وروابط الواتساب والدعم الفني</span>
              </h4>
              <p className="text-[9px] text-stone-400 mb-3">
                تظهر هذه الأرقام للمستخدمين في شاشات الاتصال وتوجيه الطلبات.
              </p>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[9px] text-stone-400 block mb-0.5">رقم المبيعات الأول:</label>
                  <input 
                    type="text"
                    value={sales1}
                    onChange={(e) => setSales1(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-white outline-none"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-stone-400 block mb-0.5">رقم المبيعات الثاني:</label>
                  <input 
                    type="text"
                    value={sales2}
                    onChange={(e) => setSales2(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-white outline-none"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-stone-400 block mb-0.5">رقم الدعم الفني والإدارة:</label>
                  <input 
                    type="text"
                    value={supportP}
                    onChange={(e) => setSupportP(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-white outline-none"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-stone-400 block mb-0.5">رابط قروب الواتساب:</label>
                  <input 
                    type="text"
                    value={groupL}
                    onChange={(e) => setGroupL(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-white outline-none"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-stone-400 block mb-0.5">رابط قناة الواتساب:</label>
                  <input 
                    type="text"
                    value={channelL}
                    onChange={(e) => setChannelL(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-white outline-none"
                    dir="ltr"
                  />
                </div>

                <button
                  onClick={handleSaveWhatsAppConfig}
                  className="w-full mt-2 py-2 rounded-lg bg-emerald-500 text-stone-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>حفظ وتحديث الأرقام سحابياً</span>
                </button>

                {savedWaToast && (
                  <p className="text-[10px] text-emerald-400 text-center font-bold">
                    ✅ تم حفظ أرقام الواتساب وتطبيقها على جميع شاشات العملاء بنجاح
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ==================== MODALS ==================== */}

      {/* 1. Clear All Orders Confirm Dialog */}
      {showClearOrdersConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-stone-900 border border-rose-500/40 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-black text-white mb-1">مسح كافة طلبات الشراء؟</h3>
            <p className="text-[10px] text-stone-400 mb-4">
              هل أنت متأكد من حذف جميع الطلبات ({orders.length} طلب) بشكل نهائي من السحابة؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAllOrders}
                className="flex-1 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold"
              >
                تأكيد المسح
              </button>
              <button
                onClick={() => setShowClearOrdersConfirm(false)}
                className="flex-1 py-1.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Single Order Delete Confirm Dialog */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-stone-900 border border-rose-500/40 rounded-2xl p-4 text-center">
            <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-white mb-1">حذف هذا الطلب؟</h3>
            <p className="text-[10px] text-stone-400 mb-3">
              سيتم حذف طلب الشراء نهائياً من قاعدة البيانات.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDeleteSingleOrder(orderToDelete)}
                className="flex-1 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold"
              >
                نعم، احذف
              </button>
              <button
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-1.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Currency Modal */}
      {showAddCurrencyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-stone-900 border border-amber-500/30 rounded-2xl p-4">
            <h3 className="text-xs font-black text-amber-400 mb-3">إضافة عملة جديدة للمنظومة</h3>
            <div className="space-y-2 text-xs">
              <input 
                type="text"
                placeholder="اسم العملة (مثال: الريال العماني)"
                value={newCurrencyName}
                onChange={(e) => setNewCurrencyName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none"
              />
              <input 
                type="text"
                placeholder="الرمز الدولي (مثال: OMR)"
                value={newCurrencyCode}
                onChange={(e) => setNewCurrencyCode(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none"
              />
              <input 
                type="number"
                placeholder="سعر البيع (ج.س)"
                value={newCurrencySell}
                onChange={(e) => setNewCurrencySell(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none"
              />
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleAddNewCurrency}
                  className="flex-1 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold"
                >
                  إضافة العملة
                </button>
                <button
                  onClick={() => setShowAddCurrencyModal(false)}
                  className="flex-1 py-1.5 rounded-xl bg-stone-800 text-stone-300 font-bold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-stone-900 border border-amber-500/30 rounded-2xl p-4">
            <h3 className="text-xs font-black text-amber-400 mb-3">إضافة سلعة تموينية جديدة</h3>
            <div className="space-y-2 text-xs">
              <input 
                type="text"
                placeholder="اسم السلعة (مثال: أرز هندي بسمتي)"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none"
              />
              <input 
                type="number"
                placeholder="السعر بالجنيه السوداني (ج.س)"
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none"
              />
              <input 
                type="text"
                placeholder="الوحدة (مثال: جوال 25 كجم)"
                value={newProdUnit}
                onChange={(e) => setNewProdUnit(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none"
              />
              <select
                value={newProdCategory}
                onChange={(e) => setNewProdCategory(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none"
              >
                <option value="sugar">السكر</option>
                <option value="flour">الدقيق</option>
                <option value="oils">الزيوت</option>
                <option value="rice">الأرز والبقوليات</option>
                <option value="foodstuffs">أخرى</option>
              </select>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleAddNewProduct}
                  className="flex-1 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold"
                >
                  إضافة السلعة
                </button>
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-1.5 rounded-xl bg-stone-800 text-stone-300 font-bold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Supervisor Modal (strictly 8-digit PIN) */}
      {showAddSupervisorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-stone-900 border border-amber-500/30 rounded-2xl p-4">
            <h3 className="text-xs font-black text-amber-400 mb-1 font-cairo">إضافة مشرف نظام جديد</h3>
            <p className="text-[9px] text-stone-400 mb-3 font-tajawal">يتطلب إدخال رمز أمان (PIN) مكون من ٨ أرقام بدقة</p>
            
            {supvPinError && (
              <div className="mb-2 p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] text-center font-bold">
                {supvPinError}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[9px] text-stone-400 block mb-0.5">معرّف المشرف (Admin ID):</label>
                <input 
                  type="text"
                  value={newSupvId}
                  onChange={(e) => setNewSupvId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none font-mono uppercase"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[9px] text-stone-400 block mb-0.5">الاسم الكامل:</label>
                <input 
                  type="text"
                  placeholder="مثال: يوسف الكتيابي"
                  value={newSupvName}
                  onChange={(e) => setNewSupvName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] text-stone-400 block mb-0.5">رقم الهاتف / واتساب:</label>
                <input 
                  type="text"
                  value={newSupvPhone}
                  onChange={(e) => setNewSupvPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[9px] text-amber-400 font-bold block mb-0.5">رمز الأمان PIN (٨ أرقام حصراً):</label>
                <input 
                  type="password"
                  maxLength={8}
                  placeholder="•••••••• (٨ أرقام)"
                  value={newSupvPin}
                  onChange={(e) => setNewSupvPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-amber-500/40 text-amber-300 outline-none font-mono text-center tracking-widest"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleCreateSupervisor}
                  className="flex-1 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold active:scale-95 transition-all"
                >
                  حفظ المشرف
                </button>
                <button
                  onClick={() => setShowAddSupervisorModal(false)}
                  className="flex-1 py-1.5 rounded-xl bg-stone-800 text-stone-300 font-bold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add Supplier Modal (strictly 8-digit PIN) */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-stone-900 border border-emerald-500/30 rounded-2xl p-4">
            <h3 className="text-xs font-black text-emerald-400 mb-1 font-cairo">إضافة مورّد معتمد جديد</h3>
            <p className="text-[9px] text-stone-400 mb-3 font-tajawal">تنفيذ مختلف وبوابة توريد خاصة مع رمز أمان ٨ أرقام</p>
            
            {suppPinError && (
              <div className="mb-2 p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] text-center font-bold">
                {suppPinError}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[9px] text-stone-400 block mb-0.5">معرّف المورّد (Supplier ID):</label>
                <input 
                  type="text"
                  value={newSuppId}
                  onChange={(e) => setNewSuppId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none font-mono uppercase"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[9px] text-stone-400 block mb-0.5">اسم المورّد أو الشركة:</label>
                <input 
                  type="text"
                  placeholder="مثال: مستودعات النيل لتجارة الغلال"
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] text-stone-400 block mb-0.5">رقم الهاتف / واتساب:</label>
                <input 
                  type="text"
                  value={newSuppPhone}
                  onChange={(e) => setNewSuppPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[9px] text-stone-400 block mb-0.5">موقع المستودع:</label>
                <input 
                  type="text"
                  value={newSuppWarehouse}
                  onChange={(e) => setNewSuppWarehouse(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] text-stone-400 block mb-0.5">السلع الموكلة (مفصولة بفواصل):</label>
                <input 
                  type="text"
                  value={newSuppAssigned}
                  onChange={(e) => setNewSuppAssigned(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] text-emerald-400 font-bold block mb-0.5">رمز الأمان PIN (٨ أرقام حصراً):</label>
                <input 
                  type="password"
                  maxLength={8}
                  placeholder="•••••••• (٨ أرقام)"
                  value={newSuppPin}
                  onChange={(e) => setNewSuppPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-emerald-500/40 text-emerald-300 outline-none font-mono text-center tracking-widest"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleCreateSupplier}
                  className="flex-1 py-1.5 rounded-xl bg-emerald-500 text-stone-950 font-bold active:scale-95 transition-all"
                >
                  حفظ المورّد
                </button>
                <button
                  onClick={() => setShowAddSupplierModal(false)}
                  className="flex-1 py-1.5 rounded-xl bg-stone-800 text-stone-300 font-bold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Confirm Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-stone-900 border border-rose-500/40 rounded-2xl p-4 text-center">
            <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-white mb-1">
              حذف {userToDelete.type === 'supervisor' ? 'المشرف' : 'المورّد'}؟
            </h3>
            <p className="text-[10px] text-stone-400 mb-3">
              هل أنت متأكد من حذف <span className="text-white font-bold">{userToDelete.name}</span> ({userToDelete.id}) نهائياً من قاعدة البيانات؟
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold active:scale-95"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-1.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
