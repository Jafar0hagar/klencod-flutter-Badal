import React, { useState, useEffect } from 'react';
import BadalAdminDashboard from './components/BadalAdminDashboard';
import AdminGatekeeper from './components/AdminGatekeeper';
import { Currency, Product, WhatsAppConfig, Order, SystemAlert } from './types';
import { INITIAL_ALERTS } from './data';
import { 
  seedDatabaseIfEmpty,
  subscribeCurrencies,
  subscribeProducts,
  subscribeOrders,
  subscribeWhatsAppConfig,
  subscribeGeneralConfig,
  subscribeSystemAlerts,
  updateCurrencyInDb,
  updateProductInDb,
  updateOrderInDb,
  updateWhatsAppConfigInDb,
  updateGeneralConfigInDb
} from './utils/firebase';

const INITIAL_WHATSAPP_CONFIG: WhatsAppConfig = {
  salesPhone1: '+249 91 234 5678',
  salesPhone2: '+249 92 345 6789',
  supportPhone: '+249 93 456 7890',
  emergencyPhone: '+249 94 567 8901',
  waLink: 'https://wa.me/249912345678',
  groupLink: 'https://chat.whatsapp.com/BadalGroup',
  channelLink: 'https://whatsapp.com/channel/0029VaBadal',
  defaultMessage: 'مرحباً، أريد الاستفسار عن المنتجات والأسعار المتوفرة. شكراً لكم.'
};

export default function App() {
  // Web Admin Dashboard unlocked by default for instant web access
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    const saved = localStorage.getItem('badal_admin_unlocked');
    return saved !== null ? saved === 'true' : true;
  });

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfig>(INITIAL_WHATSAPP_CONFIG);
  const [currentFrancRate, setCurrentFrancRate] = useState<number>(5900);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS);

  useEffect(() => {
    // Seed database if completely empty on first launch
    seedDatabaseIfEmpty().catch(err => {
      console.warn('Seeding check notice:', err);
    });

    // Real-time subscriptions to Firestore
    const unsubCurrencies = subscribeCurrencies(setCurrencies);
    const unsubProducts = subscribeProducts(setProducts);
    const unsubOrders = subscribeOrders(setOrders);
    const unsubWhatsApp = subscribeWhatsAppConfig(setWhatsAppConfig);
    const unsubGeneral = subscribeGeneralConfig(setCurrentFrancRate);
    const unsubAlerts = subscribeSystemAlerts(setSystemAlerts);

    return () => {
      if (unsubCurrencies) unsubCurrencies();
      if (unsubProducts) unsubProducts();
      if (unsubOrders) unsubOrders();
      if (unsubWhatsApp) unsubWhatsApp();
      if (unsubGeneral) unsubGeneral();
      if (unsubAlerts) unsubAlerts();
    };
  }, []);

  const handleUpdateCurrencies = (updatedList: Currency[]) => {
    setCurrencies(updatedList);
    updatedList.forEach(curr => {
      updateCurrencyInDb(curr).catch(err => console.error('Failed to update currency:', err));
    });
  };

  const handleUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    updatedProducts.forEach(prod => {
      updateProductInDb(prod).catch(err => console.error('Failed to update product:', err));
    });
  };

  const handleUpdateOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    updatedOrders.forEach(ord => {
      updateOrderInDb(ord).catch(err => console.error('Failed to update order:', err));
    });
  };

  const handleUpdateFrancRate = (rate: number) => {
    setCurrentFrancRate(rate);
    updateGeneralConfigInDb(rate).catch(err => console.error('Failed to update franc rate:', err));
  };

  const handleUpdateWhatsAppConfig = (config: WhatsAppConfig) => {
    setWhatsAppConfig(config);
    updateWhatsAppConfigInDb(config).catch(err => console.error('Failed to update WhatsApp config:', err));
  };

  const handleUnlockAdmin = () => {
    setIsAdminUnlocked(true);
    localStorage.setItem('badal_admin_unlocked', 'true');
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    localStorage.removeItem('badal_admin_unlocked');
  };

  if (!isAdminUnlocked) {
    return <AdminGatekeeper onUnlock={handleUnlockAdmin} />;
  }

  return (
    <BadalAdminDashboard
      currencies={currencies}
      onUpdateCurrencies={handleUpdateCurrencies}
      products={products}
      onUpdateProducts={handleUpdateProducts}
      orders={orders}
      onUpdateOrders={handleUpdateOrders}
      currentFrancRate={currentFrancRate}
      onUpdateFrancRate={handleUpdateFrancRate}
      whatsAppConfig={whatsAppConfig}
      onUpdateWhatsAppConfig={handleUpdateWhatsAppConfig}
      systemAlerts={systemAlerts}
      onLogout={handleLockAdmin}
    />
  );
}
