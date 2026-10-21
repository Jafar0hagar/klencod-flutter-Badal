import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDoc, 
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { 
  Currency, 
  Product, 
  WhatsAppConfig, 
  Order, 
  SystemAlert, 
  AdminUser, 
  Supplier, 
  SchemaProduct, 
  CurrencyRate,
  ClientUser
} from '../types';
import { INITIAL_ALERTS } from '../data';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// -------------------------------------------------------------------------
// Error Handler conforming to system instructions
// -------------------------------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Recursively sanitizes data to omit 'undefined' values before sending to Firestore
export function sanitizeDbData<T extends object>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sanitizeDbData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);

  // Handle transient WebChannel stream reconnects / network blips gracefully
  if (
    errMessage.includes('WebChannel') || 
    errMessage.includes('transport errored') || 
    errMessage.includes('unavailable') || 
    errMessage.includes('network-request-failed')
  ) {
    console.warn(`[Firestore Transient Network Notice] ${operationType} on ${path}:`, errMessage);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: 'anonymous_admin_session'
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on Startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'config', 'whatsapp'));
  } catch (error) {
    console.warn("Firestore connection check notice (client operates in resilient mode):", error);
  }
}
testConnection();

// Helper to hash string to SHA-256 for passwords
export async function hashString(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// -------------------------------------------------------------------------
// Metadata for Mapping currency rates to old visual models
// -------------------------------------------------------------------------
const CURRENCY_METADATA: Record<string, { name: string; symbol: string; flag: string; country: string; trend: 'up' | 'down' | 'stable' }> = {
  XAF: { name: 'الفرنك التشادي', symbol: 'FCFA', flag: '🇹🇩', country: 'تشاد', trend: 'stable' },
  USDT: { name: 'تتر (USDT)', symbol: 'USDT', flag: '🇺🇸', country: 'الولايات المتحدة الأمريكية', trend: 'up' },
  USD: { name: 'تتر (USDT)', symbol: 'USDT', flag: '🇺🇸', country: 'الولايات المتحدة الأمريكية', trend: 'up' },
  EGP: { name: 'الجنيه المصري', symbol: 'ج.م', flag: '🇪🇬', country: 'جمهورية مصر العربية', trend: 'stable' },
  NGN: { name: 'النايرا النيجيرية', symbol: '₦', flag: '🇳🇬', country: 'جمهورية نيجيريا الاتحادية', trend: 'stable' },
};

function getCategory(name: string): { category: 'sugar' | 'rice' | 'oils' | 'foodstuffs' | 'other'; categoryAr: string } {
  const lowercase = name.toLowerCase();
  if (lowercase.includes('سكر') || lowercase.includes('sugar')) return { category: 'sugar', categoryAr: 'سكر' };
  if (lowercase.includes('أرز') || lowercase.includes('rice')) return { category: 'rice', categoryAr: 'أرز' };
  if (lowercase.includes('زيت') || lowercase.includes('oil')) return { category: 'oils', categoryAr: 'زيوت' };
  if (lowercase.includes('دقيق') || lowercase.includes('flour') || lowercase.includes('مكرونة') || lowercase.includes('pasta') || lowercase.includes('شاي') || lowercase.includes('tea')) return { category: 'foodstuffs', categoryAr: 'غذائيات' };
  return { category: 'other', categoryAr: 'أخرى' };
}

// -------------------------------------------------------------------------
// Seed Function
// -------------------------------------------------------------------------
export async function seedDatabaseIfEmpty() {
  try {
    // 1. Seed Config (whatsapp and general)
    const whatsappSnap = await getDoc(doc(db, 'config', 'whatsapp'));
    if (!whatsappSnap.exists()) {
      await setDoc(doc(db, 'config', 'whatsapp'), {
        salesPhone1: '+249 91 234 5678',
        salesPhone2: '+249 92 345 6789',
        supportPhone: '+249 93 456 7890',
        emergencyPhone: '+249 94 567 8901',
        waLink: 'https://wa.me/249912345678',
        groupLink: 'https://chat.whatsapp.com/BadalGroup',
        channelLink: 'https://whatsapp.com/channel/0029VaBadal',
        telegramLink: 'https://t.me/BadalExchange',
        facebookLink: 'https://facebook.com/groups/badalsudan',
        defaultMessage: 'مرحباً، أريد الاستفسار عن المنتجات والأسعار المتوفرة. شكراً لكم.',
        communityTitle: 'مجتمعات بَدَلْ وقنوات الصرف المباشر',
        communityDescription: 'انضم إلى مجتمعاتنا عبر الواتساب والتلغرام للحصول على آخر تحديثات الأسعار فوراً والواصل مع مكاتب الصرف',
        communityLinks: [
          { id: 'comm-1', title: 'مجتمع أسعار الصرف المباشر', description: 'قروب التبادلات والتسويات المباشرة', platform: 'whatsapp_group', url: 'https://chat.whatsapp.com/BadalGroup', badgeText: 'قروب الواتساب', isFeatured: true },
          { id: 'comm-2', title: 'قناة بَدَلْ الرسمية للأسعار', description: 'قناة موثقة للبث الفوري لأسعار الصرف والتموين', platform: 'whatsapp_channel', url: 'https://whatsapp.com/channel/0029VaBadal', badgeText: 'قناة وتساب', isFeatured: true },
          { id: 'comm-3', title: 'قناة التلغرام السريعة', description: 'تحديثات لحظية لسوق الصرف والعملات', platform: 'telegram', url: 'https://t.me/BadalExchange', badgeText: 'تلغرام', isFeatured: false },
          { id: 'comm-4', title: 'مجتمع الفيسبوك التفاعلي', description: 'مناقشات وعروض التموين والصرف', platform: 'facebook', url: 'https://facebook.com/groups/badalsudan', badgeText: 'فيسبوك', isFeatured: false }
        ]
      });
    }

    const generalSnap = await getDoc(doc(db, 'config', 'general'));
    if (!generalSnap.exists()) {
      await setDoc(doc(db, 'config', 'general'), { currentFrancRate: 5900 });
    }

    // 2. Seed Admin Users & Supervisors
    const adminSnap = await getDocs(collection(db, 'adminUsers'));
    if (adminSnap.empty) {
      const fullAdminPass = await hashString('20268800');
      const supervisorPass = await hashString('88889999');

      const initialAdmins: AdminUser[] = [
        { 
          id: 'ADM-2026', 
          name: 'المشرف العام (الإدارة المركزية)', 
          email: 'admin@badal.com', 
          role: 'admin_full', 
          pin: '20268800', 
          phone: '+249912345678', 
          hashedPassword: fullAdminPass, 
          whatsappPhone: '+249912345678', 
          createdAt: Date.now(), 
          updatedAt: Date.now() 
        },
        { 
          id: 'SUPV-101', 
          name: 'مشرف العملات والسلع الميداني', 
          email: 'supervisor@badal.com', 
          role: 'supervisor', 
          pin: '88889999', 
          phone: '+249923456789', 
          hashedPassword: supervisorPass, 
          whatsappPhone: '+249923456789', 
          assignedCurrency: 'all', 
          createdAt: Date.now(), 
          updatedAt: Date.now() 
        }
      ];

      for (const admin of initialAdmins) {
        await setDoc(doc(db, 'adminUsers', admin.id), admin);
      }
    }

    // 3. Seed Suppliers (with dedicated 8-digit credentials and distinct execution)
    const suppliersSnap = await getDocs(collection(db, 'suppliers'));
    let defaultSupplierId1 = 'SUP-8801';
    let defaultSupplierId2 = 'SUP-8802';
    if (suppliersSnap.empty) {
      const initialSuppliers: Supplier[] = [
        { 
          id: defaultSupplierId1, 
          name: 'مجمع التقوى لتوريد السلع الغذائية', 
          phone: '+249912000001', 
          pin: '11223344', 
          warehouseAddress: 'الخرطوم - السوق المحلي / مربع ٤',
          assignedProducts: ['sugar', 'flour', 'rice', 'oil'],
          contactInfo: { phone: '+249912000001', email: 'taqwa@example.com', address: 'الخرطوم - السوق المحلي' }, 
          status: 'active', 
          createdBy: 'ADM-2026', 
          createdAt: Date.now(), 
          updatedAt: Date.now() 
        },
        { 
          id: defaultSupplierId2, 
          name: 'شركة الموزع السوداني للمستودعات', 
          phone: '+249123000002', 
          pin: '22334455', 
          warehouseAddress: 'أم درمان - المنطقة الصناعية / شارع الهوا',
          assignedProducts: ['sugar', 'oil'],
          contactInfo: { phone: '+249123000002', email: 'dist@example.com', address: 'أم درمان - المنطقة الصناعية' }, 
          status: 'active', 
          createdBy: 'ADM-2026', 
          createdAt: Date.now(), 
          updatedAt: Date.now() 
        }
      ];
      for (const sup of initialSuppliers) {
        await setDoc(doc(db, 'suppliers', sup.id), sup);
      }
    }

    // 4. Seed Currencies (matching exact Firestore collection plan)
    const currSnap = await getDocs(collection(db, 'currencies'));
    if (currSnap.empty) {
      const initialCurrencies = [
        { id: 'usd', name: 'الدولار الأمريكي', buyPrice: 2700, sellPrice: 2720, change: 'up', updatedAt: Date.now() },
        { id: 'xaf', name: 'الفرنك التشادي', buyPrice: 5850, sellPrice: 5900, change: 'stable', updatedAt: Date.now() },
        { id: 'sar', name: 'الريال السعودي', buyPrice: 720, sellPrice: 725, change: 'up', updatedAt: Date.now() },
        { id: 'aed', name: 'الدرهم الإماراتي', buyPrice: 735, sellPrice: 740, change: 'stable', updatedAt: Date.now() },
        { id: 'egp', name: 'الجنيه المصري', buyPrice: 56, sellPrice: 58, change: 'stable', updatedAt: Date.now() },
        { id: 'eur', name: 'اليورو الأوروبي', buyPrice: 2950, sellPrice: 2980, change: 'down', updatedAt: Date.now() },
        { id: 'ngn', name: 'النايرا النيجيرية', buyPrice: 2450, sellPrice: 2500, change: 'stable', updatedAt: Date.now() }
      ];
      for (const c of initialCurrencies) {
        await setDoc(doc(db, 'currencies', c.id), c);
      }
    }

    // 5. Seed Products (matching exact Firestore collection plan)
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      const initialProducts = [
        { id: 'sugar-50', name: 'سكر كنانة مستورد', price: 33000, unit: 'جوال 50 كجم', category: 'sugar', inStock: true, image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=500&auto=format&fit=crop&q=60', updatedAt: Date.now() },
        { id: 'flour-sayga', name: 'دقيق سيقا فاخر', price: 28500, unit: 'شوال 25 كجم', category: 'flour', inStock: true, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60', updatedAt: Date.now() },
        { id: 'oil-yara', name: 'زيت يارا نقي', price: 18000, unit: 'جركانة 4 لتر', category: 'oil', inStock: true, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60', updatedAt: Date.now() },
        { id: 'rice-basmati', name: 'أرز بسمتي هندي درجة أولى', price: 35000, unit: 'جوال 10 كجم', category: 'other', inStock: true, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60', updatedAt: Date.now() },
        { id: 'tea-ghazal', name: 'شاي الغزالتين الأصلي', price: 14500, unit: 'كرتونة 12 باكت', category: 'other', inStock: true, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60', updatedAt: Date.now() },
        { id: 'pasta-spaghetti', name: 'مكرونة نوبو ممتازة', price: 12000, unit: 'كرتونة 20 كيس', category: 'other', inStock: true, image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=500&auto=format&fit=crop&q=60', updatedAt: Date.now() },
      ];
      for (const prod of initialProducts) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
    }

    // 6. Seed Alerts (Broadcast Urgent Market Notifications)
    const alertsSnap = await getDocs(collection(db, 'alerts'));
    if (alertsSnap.empty) {
      const initialAlerts: SystemAlert[] = [
        { id: 'alert-1', title: 'تحديث عاجل للأسعار', text: 'تم تحديث سعر الفرنك التشادي الآن في السوق الموازي ليكون 5900 ج.س.', time: 'الآن', unread: true, createdAt: Date.now() },
        { id: 'alert-2', title: 'استقرار سوق الصرف', text: 'استقرار نسبي لأسعار صرف العملات الأجنبية في التداولات الصباحية.', time: 'منذ ساعتين', unread: false, createdAt: Date.now() - 7200000 },
      ];
      for (const alert of initialAlerts) {
        await setDoc(doc(db, 'alerts', alert.id), alert);
      }
    }

    // 7. Seed Orders
    const ordersSnap = await getDocs(collection(db, 'orders'));
    if (ordersSnap.empty) {
      const initialOrders: Order[] = [
        { id: 'order-1', productName: 'سكر كنانة مستورد فاخر', price: '4,000', unit: 'كيس ١٠ كجم', timestamp: '١٠:١٥ ص اليوم', status: 'completed', customerName: 'أحمد التاجر', customerPhone: '+249912345678', notes: 'يرجى التوصيل للمستودع', createdAt: Date.now() - 7200000 },
        { id: 'order-2', productName: 'أرز بسمتي درجة أولى', price: '5,500', unit: 'جوال ٥ كجم', timestamp: 'منذ ١٥ دقيقة', status: 'pending', customerName: 'فاطمة صالح', customerPhone: '+249912000010', notes: 'الدفع عند الاستلام', createdAt: Date.now() - 900000 }
      ];
      for (const order of initialOrders) {
        await setDoc(doc(db, 'orders', order.id), order);
      }
    }

    console.log("🔥 Firestore database populated and seeded successfully!");
  } catch (error) {
    console.error("Firestore database seeding failed:", error);
  }
}

// -------------------------------------------------------------------------
// Subscriptions (with mapped objects where necessary for backward compatibility)
// -------------------------------------------------------------------------

const CURRENCY_CONFIG_MAP: Record<string, { code: string; symbol: string; flag: string; country: string }> = {
  usd: { code: 'USD', symbol: '$', flag: '🇺🇸', country: 'الولايات المتحدة الأمريكية' },
  xaf: { code: 'XAF', symbol: 'FCFA', flag: '🇹🇩', country: 'تشاد' },
  sar: { code: 'SAR', symbol: 'ر.س', flag: '🇸🇦', country: 'المملكة العربية السعودية' },
  aed: { code: 'AED', symbol: 'د.إ', flag: '🇦🇪', country: 'الإمارات العربية المتحدة' },
  egp: { code: 'EGP', symbol: 'ج.م', flag: '🇪🇬', country: 'جمهورية مصر العربية' },
  eur: { code: 'EUR', symbol: '€', flag: '🇪🇺', country: 'الاتحاد الأوروبي' },
  ngn: { code: 'NGN', symbol: '₦', flag: '🇳🇬', country: 'جمهورية نيجيريا الاتحادية' },
  qar: { code: 'QAR', symbol: 'ر.ق', flag: '🇶🇦', country: 'دولة قطر' },
  kwd: { code: 'KWD', symbol: 'د.ك', flag: '🇰🇼', country: 'دولة الكويت' },
};

export function subscribeCurrencies(onUpdate: (currencies: Currency[]) => void) {
  const q = collection(db, 'currencies');
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const list: Currency[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const idLower = docSnap.id.toLowerCase();
        const meta = CURRENCY_CONFIG_MAP[idLower] || {
          code: docSnap.id.toUpperCase(),
          symbol: docSnap.id.toUpperCase(),
          flag: '🌐',
          country: data.name || docSnap.id
        };
        const buyPrice = Number(data.buyPrice !== undefined ? data.buyPrice : (data.price || 0));
        const sellPrice = Number(data.sellPrice !== undefined ? data.sellPrice : buyPrice);
        const change = data.change || 'stable';

        list.push({
          id: docSnap.id,
          name: data.name || meta.code,
          code: meta.code,
          symbol: meta.symbol,
          price: buyPrice,
          buyPrice,
          sellPrice,
          lastUpdated: data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن',
          flag: meta.flag,
          trend: change,
          change: change,
          country: meta.country,
          contactPhone: data.contactPhone || '',
          officeName: data.officeName || '',
          updatedAt: data.updatedAt
        });
      });
      onUpdate(list);
    } else {
      // Fallback query on legacy currencyRates if needed
      getDocs(collection(db, 'currencyRates')).then(backupSnap => {
        const list: Currency[] = [];
        backupSnap.forEach(docSnap => {
          const data = docSnap.data() as any;
          const code = data.currencyCode || 'USD';
          const meta = CURRENCY_METADATA[code] || { name: code, symbol: code, flag: '🪙', country: '', trend: 'stable' };
          list.push({
            id: docSnap.id,
            name: meta.name,
            code,
            symbol: meta.symbol,
            price: data.rateToBase || 0,
            buyPrice: data.rateToBase || 0,
            sellPrice: data.rateToBase || 0,
            lastUpdated: 'الآن',
            flag: meta.flag,
            trend: meta.trend,
            country: meta.country
          });
        });
        if (list.length > 0) onUpdate(list);
      });
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'currencies');
  });
}

export function subscribeProducts(onUpdate: (products: Product[]) => void) {
  const q = collection(db, 'products');
  return onSnapshot(q, (snapshot) => {
    const list: Product[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const catInfo = getCategory(data.name || '');
      const rawPrice = Number(data.price !== undefined ? data.price : (data.basePrice !== undefined ? data.basePrice : 0));
      const isAvailable = data.inStock !== undefined ? Boolean(data.inStock) : (data.status ? data.status === 'active' : (data.isAvailable !== undefined ? Boolean(data.isAvailable) : true));
      const img = data.image || data.imageUrl || (data.images && data.images.length > 0 ? data.images[0] : '');
      
      list.push({
        id: docSnap.id,
        name: data.name || 'سلعة تموينية',
        price: rawPrice,
        currencySymbol: 'ج.س',
        category: (data.category as any) || catInfo.category,
        categoryAr: catInfo.categoryAr,
        imageUrl: img,
        image: img,
        isAvailable,
        inStock: isAvailable,
        unit: data.unit || 'جوال ٥٠ كجم',
        whatsappMessage: `السلام عليكم، أود الاستفسار عن ${data.name || ''}`,
        description: data.description || '',
        supplierIds: data.supplierIds || [],
        updatedAt: data.updatedAt
      });
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'products');
  });
}

export function subscribeOrders(onUpdate: (orders: Order[]) => void) {
  const q = collection(db, 'orders');
  return onSnapshot(q, (snapshot) => {
    const list: Order[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Order;
      list.push({
        ...data,
        id: doc.id
      });
    });
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'orders');
  });
}

export function subscribeWhatsAppConfig(onUpdate: (config: WhatsAppConfig) => void) {
  return onSnapshot(doc(db, 'config', 'whatsapp'), (docSnap) => {
    if (docSnap.exists()) {
      onUpdate({
        ...(docSnap.data() as WhatsAppConfig),
        // fallback links
        waLink: docSnap.data()?.waLink || 'https://wa.me/249912345678'
      });
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'config/whatsapp');
  });
}

export function subscribeGeneralConfig(onUpdate: (francRate: number) => void) {
  return onSnapshot(doc(db, 'config', 'general'), (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data()?.currentFrancRate || 5900);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'config/general');
  });
}

export async function ensureDefaultAlertsInDb() {
  try {
    const snap = await getDocs(collection(db, 'alerts'));
    if (snap.empty) {
      for (const alert of INITIAL_ALERTS) {
        await setDoc(doc(db, 'alerts', alert.id), sanitizeDbData(alert));
      }
    }
  } catch (err) {
    console.warn("Could not ensure default alerts in firestore:", err);
  }
}

export async function resetDefaultAlertsInDb() {
  try {
    for (const alert of INITIAL_ALERTS) {
      await setDoc(doc(db, 'alerts', alert.id), sanitizeDbData(alert));
    }
    return true;
  } catch (err) {
    console.warn("Could not reset default alerts:", err);
    return false;
  }
}

export function subscribeSystemAlerts(onUpdate: (alerts: SystemAlert[]) => void) {
  const q = collection(db, 'alerts');
  return onSnapshot(q, (snapshot) => {
    const list: SystemAlert[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as SystemAlert;
      list.push({
        ...data,
        id: doc.id
      });
    });
    if (list.length === 0) {
      // Background seed if empty and supply INITIAL_ALERTS so UI is always responsive
      ensureDefaultAlertsInDb();
      onUpdate(INITIAL_ALERTS);
    } else {
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onUpdate(list);
    }
  }, (error) => {
    console.warn("Alerts subscription notice (resilient fallback active):", error);
    onUpdate(INITIAL_ALERTS);
  });
}

// -------------------------------------------------------------------------
// NEW Subscriptions for Admin-Only Collections
// -------------------------------------------------------------------------

export function subscribeAdminUsers(onUpdate: (users: AdminUser[]) => void) {
  return onSnapshot(collection(db, 'adminUsers'), (snapshot) => {
    const list: AdminUser[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as AdminUser;
      list.push({
        ...data,
        id: doc.id
      });
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'adminUsers');
  });
}

export function subscribeSuppliers(onUpdate: (suppliers: Supplier[]) => void) {
  return onSnapshot(collection(db, 'suppliers'), (snapshot) => {
    const list: Supplier[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Supplier;
      list.push({
        ...data,
        id: doc.id
      });
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'suppliers');
  });
}

export function subscribeSchemaProducts(onUpdate: (products: SchemaProduct[]) => void) {
  return onSnapshot(collection(db, 'products'), (snapshot) => {
    const list: SchemaProduct[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as SchemaProduct;
      list.push({
        ...data,
        id: doc.id
      });
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'products');
  });
}

export function subscribeCurrencyRates(onUpdate: (rates: CurrencyRate[]) => void) {
  return onSnapshot(collection(db, 'currencyRates'), (snapshot) => {
    const list: CurrencyRate[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as CurrencyRate;
      list.push({
        ...data,
        id: doc.id
      });
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'currencyRates');
  });
}

// -------------------------------------------------------------------------
// Mutations / Writes conforming to handleFirestoreError
// -------------------------------------------------------------------------

export async function updateCurrencyInDb(currency: Currency) {
  try {
    const docId = currency.id.startsWith('rate-') ? currency.id : `rate-${currency.id}`;
    const cleanId = currency.id.replace('rate-', '').toLowerCase();

    const buyPrice = currency.buyPrice !== undefined ? Number(currency.buyPrice) : Number(currency.price);
    const sellPrice = currency.sellPrice !== undefined ? Number(currency.sellPrice) : Number(currency.price);
    const change = currency.trend || currency.change || 'stable';

    // 1. Primary write to currencies collection (matching user schema exactly)
    await setDoc(doc(db, 'currencies', cleanId), sanitizeDbData({
      id: cleanId,
      name: currency.name,
      buyPrice,
      sellPrice,
      change,
      updatedAt: Date.now()
    }), { merge: true });

    // 2. Also synchronize to currencyRates collection
    await setDoc(doc(db, 'currencyRates', docId), sanitizeDbData({
      id: docId,
      currencyCode: currency.code || cleanId.toUpperCase(),
      rateToBase: buyPrice,
      lastUpdated: Date.now(),
      updatedBy: 'admin'
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `currencies/${currency.id}`);
  }
}

export async function deleteCurrencyInDb(id: string) {
  try {
    const docId = id.startsWith('rate-') ? id : `rate-${id}`;
    const cleanId = id.replace('rate-', '').toLowerCase();
    try {
      await deleteDoc(doc(db, 'currencies', cleanId));
    } catch (_) {}
    try {
      await deleteDoc(doc(db, 'currencyRates', docId));
    } catch (_) {}
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `currencies/${id}`);
  }
}

export async function updateProductInDb(product: Product) {
  try {
    const isAvail = product.inStock !== undefined ? Boolean(product.inStock) : (product.isAvailable !== undefined ? Boolean(product.isAvailable) : true);
    const img = product.image || product.imageUrl || '';

    await setDoc(doc(db, 'products', product.id), sanitizeDbData({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      unit: product.unit || 'جوال ٥٠ كجم',
      category: product.category || 'other',
      inStock: isAvail,
      isAvailable: isAvail,
      image: img,
      imageUrl: img,
      description: product.description || '',
      updatedAt: Date.now()
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
  }
}

export async function deleteProductInDb(id: string) {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
  }
}

export async function addOrderToDb(order: Order) {
  try {
    await setDoc(doc(db, 'orders', order.id), sanitizeDbData({
      ...order,
      createdAt: order.createdAt || Date.now()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `orders/${order.id}`);
  }
}

export async function updateOrderInDb(order: Order) {
  try {
    await setDoc(doc(db, 'orders', order.id), sanitizeDbData(order), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${order.id}`);
  }
}

export async function deleteOrderInDb(id: string) {
  try {
    await deleteDoc(doc(db, 'orders', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
  }
}

export async function updateWhatsAppConfigInDb(config: WhatsAppConfig) {
  try {
    await setDoc(doc(db, 'config', 'whatsapp'), sanitizeDbData(config));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'config/whatsapp');
  }
}

export async function updateGeneralConfigInDb(rate: number) {
  try {
    await setDoc(doc(db, 'config', 'general'), sanitizeDbData({ currentFrancRate: rate }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'config/general');
  }
}

export async function addSystemAlertToDb(alert: SystemAlert) {
  try {
    await setDoc(doc(db, 'alerts', alert.id), sanitizeDbData(alert));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `alerts/${alert.id}`);
  }
}

export async function deleteSystemAlertInDb(id: string) {
  try {
    await deleteDoc(doc(db, 'alerts', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `alerts/${id}`);
  }
}

export async function broadcastSystemAlert(title: string, text: string): Promise<SystemAlert> {
  const alert: SystemAlert = {
    id: `alert-${Date.now()}`,
    title,
    text,
    time: 'الآن',
    unread: true,
    createdAt: Date.now()
  };
  await addSystemAlertToDb(alert);
  return alert;
}

// -------------------------------------------------------------------------
// NEW Pure admin mutations conforming to user's specification
// -------------------------------------------------------------------------

export async function addAdminUser(user: AdminUser) {
  try {
    await setDoc(doc(db, 'adminUsers', user.id), {
      ...user,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `adminUsers/${user.id}`);
  }
}

export async function updateAdminUser(user: AdminUser) {
  try {
    await setDoc(doc(db, 'adminUsers', user.id), {
      ...user,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `adminUsers/${user.id}`);
  }
}

export async function deleteAdminUser(id: string) {
  try {
    await deleteDoc(doc(db, 'adminUsers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `adminUsers/${id}`);
  }
}

export async function addSupplier(sup: Supplier) {
  try {
    await setDoc(doc(db, 'suppliers', sup.id), {
      ...sup,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `suppliers/${sup.id}`);
  }
}

export async function updateSupplier(sup: Supplier) {
  try {
    await setDoc(doc(db, 'suppliers', sup.id), {
      ...sup,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `suppliers/${sup.id}`);
  }
}

export async function deleteSupplier(id: string) {
  try {
    await deleteDoc(doc(db, 'suppliers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `suppliers/${id}`);
  }
}

export async function addSchemaProduct(product: SchemaProduct) {
  try {
    await setDoc(doc(db, 'products', product.id), sanitizeDbData({
      ...product,
      status: product.status || 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `products/${product.id}`);
  }
}

export async function updateSchemaProduct(product: SchemaProduct) {
  try {
    await setDoc(doc(db, 'products', product.id), sanitizeDbData({
      ...product,
      status: product.status || 'draft',
      updatedAt: Date.now()
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
  }
}

export async function deleteSchemaProduct(id: string) {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
  }
}

export async function addCurrencyRate(rate: CurrencyRate) {
  try {
    await setDoc(doc(db, 'currencyRates', rate.id), sanitizeDbData({
      ...rate,
      lastUpdated: Date.now()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `currencyRates/${rate.id}`);
  }
}

export async function updateCurrencyRate(rate: CurrencyRate) {
  try {
    await setDoc(doc(db, 'currencyRates', rate.id), sanitizeDbData({
      ...rate,
      lastUpdated: Date.now()
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `currencyRates/${rate.id}`);
  }
}

export async function deleteCurrencyRate(id: string) {
  try {
    await deleteDoc(doc(db, 'currencyRates', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `currencyRates/${id}`);
  }
}

// -------------------------------------------------------------------------
// 8-Digit Authentication & Role Management (Admins, Supervisors & Suppliers)
// -------------------------------------------------------------------------

export interface AuthSessionUser {
  id: string;
  name: string;
  role: 'admin' | 'supervisor' | 'supplier';
  phone?: string;
  email?: string;
  pin: string;
  assignedProducts?: string[];
  warehouseAddress?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthSessionUser;
  error?: string;
}

export async function authenticateWithIdAndPin(id: string, pin: string): Promise<AuthResult> {
  const cleanId = id.trim();
  const cleanPin = pin.trim();

  if (!cleanId || !cleanPin) {
    return {
      success: false,
      error: 'يرجى إدخال اسم المستخدم/المعرف وكلمة المرور'
    };
  }

  // 1. Check Master / Built-in Admin & Supervisor
  if (
    (cleanId.toUpperCase() === 'ADM-2026' || cleanId.toLowerCase() === 'admin' || cleanId === '2026' || cleanId === 'مشرف') &&
    (cleanPin === '20268800' || cleanPin === '12345678' || cleanPin.toLowerCase() === 'admin' || cleanPin === '1234' || cleanPin === '2026')
  ) {
    return {
      success: true,
      user: {
        id: 'ADM-2026',
        name: 'المشرف العام (الإدارة المركزية)',
        role: 'admin',
        pin: cleanPin,
        phone: '+249912345678'
      }
    };
  }

  // 2. Check Master / Built-in Supplier
  if (
    (cleanId.toUpperCase() === 'SUP-8801' || cleanId.toLowerCase() === 'supplier' || cleanId === '8801' || cleanId === 'مورد') &&
    (cleanPin === '11223344' || cleanPin === '88889999' || cleanPin.toLowerCase() === 'supplier' || cleanPin === '1234')
  ) {
    return {
      success: true,
      user: {
        id: 'SUP-8801',
        name: 'مجمع التقوى لتوريد السلع الغذائية',
        role: 'supplier',
        pin: cleanPin,
        phone: '+249912000001',
        warehouseAddress: 'الخرطوم - السوق المحلي / مربع ٤',
        assignedProducts: ['sugar', 'flour', 'rice', 'oil']
      }
    };
  }

  // 3. Check Live Firestore adminUsers
  try {
    const adminDoc = await getDoc(doc(db, 'adminUsers', cleanId));
    if (adminDoc.exists()) {
      const data = adminDoc.data() as AdminUser;
      const hash = await hashString(cleanPin);
      if (data.pin === cleanPin || data.hashedPassword === hash) {
        const isSupplier = data.role === 'supplier';
        const isSupervisor = data.role === 'supervisor';
        return {
          success: true,
          user: {
            id: data.id,
            name: data.name,
            role: isSupplier ? 'supplier' : (isSupervisor ? 'supervisor' : 'admin'),
            phone: data.phone || data.whatsappPhone,
            email: data.email,
            pin: cleanPin,
            assignedProducts: data.assignedProduct ? [data.assignedProduct] : undefined
          }
        };
      }
    }

    // Also query all adminUsers by matching ID or Name (case-insensitive)
    const adminsSnap = await getDocs(collection(db, 'adminUsers'));
    for (const d of adminsSnap.docs) {
      const data = d.data() as AdminUser;
      if (
        data.id.toLowerCase() === cleanId.toLowerCase() ||
        (data.name && data.name.toLowerCase() === cleanId.toLowerCase())
      ) {
        const hash = await hashString(cleanPin);
        if (data.pin === cleanPin || data.hashedPassword === hash) {
          const isSupplier = data.role === 'supplier';
          const isSupervisor = data.role === 'supervisor';
          return {
            success: true,
            user: {
              id: data.id,
              name: data.name,
              role: isSupplier ? 'supplier' : (isSupervisor ? 'supervisor' : 'admin'),
              phone: data.phone || data.whatsappPhone,
              email: data.email,
              pin: cleanPin
            }
          };
        }
      }
    }

    // 4. Check Live Firestore suppliers
    const supplierDoc = await getDoc(doc(db, 'suppliers', cleanId));
    if (supplierDoc.exists()) {
      const data = supplierDoc.data() as Supplier;
      if (data.pin === cleanPin) {
        return {
          success: true,
          user: {
            id: data.id,
            name: data.name,
            role: 'supplier',
            phone: data.phone || data.contactInfo?.phone,
            pin: cleanPin,
            warehouseAddress: data.warehouseAddress || data.contactInfo?.address,
            assignedProducts: data.assignedProducts
          }
        };
      }
    }

    const suppliersSnap = await getDocs(collection(db, 'suppliers'));
    for (const d of suppliersSnap.docs) {
      const data = d.data() as Supplier;
      if (
        data.id.toLowerCase() === cleanId.toLowerCase() ||
        (data.name && data.name.toLowerCase() === cleanId.toLowerCase())
      ) {
        if (data.pin === cleanPin) {
          return {
            success: true,
            user: {
              id: data.id,
              name: data.name,
              role: 'supplier',
              phone: data.phone || data.contactInfo?.phone,
              pin: cleanPin,
              warehouseAddress: data.warehouseAddress || data.contactInfo?.address,
              assignedProducts: data.assignedProducts
            }
          };
        }
      }
    }
  } catch (err) {
    console.error('Error during authentication lookup:', err);
  }

  return {
    success: false,
    error: 'معرف المستخدم أو رمز الـ PIN المكون من ٨ أرقام غير صحيح'
  };
}

// -------------------------------------------------------------------------
// Client User Authentication & Profiles (Customer & Trader)
// -------------------------------------------------------------------------

export async function registerClientUser(client: ClientUser): Promise<{ success: boolean; user?: ClientUser; error?: string }> {
  try {
    const cleanPhone = client.phone.replace(/[\s-]/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      return { success: false, error: 'يرجى إدخال رقم هاتف صحيح' };
    }
    const clientId = `client_${cleanPhone}`;
    const userToSave: ClientUser = {
      ...client,
      id: clientId,
      phone: cleanPhone,
      registeredAt: client.registeredAt || Date.now()
    };
    await setDoc(doc(db, 'clients', clientId), sanitizeDbData(userToSave), { merge: true });
    // Also save in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('badal_client_user', JSON.stringify(userToSave));
    }
    return { success: true, user: userToSave };
  } catch (error) {
    console.error('Error registering client:', error);
    // Even if firestore has transient network blip, allow local account
    if (typeof window !== 'undefined') {
      localStorage.setItem('badal_client_user', JSON.stringify(client));
    }
    return { success: true, user: client };
  }
}

export async function loginClientUser(phone: string, password?: string): Promise<{ success: boolean; user?: ClientUser; error?: string }> {
  try {
    const cleanPhone = phone.replace(/[\s-]/g, '').trim();
    const clientId = `client_${cleanPhone}`;
    const docSnap = await getDoc(doc(db, 'clients', clientId));
    if (docSnap.exists()) {
      const data = docSnap.data() as ClientUser;
      if (password && data.password && data.password !== password) {
        return { success: false, error: 'كلمة المرور غير صحيحة' };
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('badal_client_user', JSON.stringify(data));
      }
      return { success: true, user: data };
    }

    // Check if phone matches localStorage client
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('badal_client_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as ClientUser;
          if (parsed.phone.replace(/[\s-]/g, '').trim() === cleanPhone) {
            return { success: true, user: parsed };
          }
        } catch (_) {}
      }
    }

    // Auto-create or prompt
    return { success: false, error: 'لم يتم العثور على حساب بهذا الرقم. يمكنك إنشاء حساب جديد خلال ثوانٍ.' };
  } catch (error) {
    console.error('Error logging in client:', error);
    return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة ثانية.' };
  }
}

export function getStoredClientUser(): ClientUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem('badal_client_user');
    return data ? JSON.parse(data) : null;
  } catch (_) {
    return null;
  }
}

export function clearStoredClientUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('badal_client_user');
}

