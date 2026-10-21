/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  price: number;
  buyPrice?: number;
  sellPrice?: number;
  lastUpdated: string;
  flag: string; // SVG or Emoji code
  trend: 'up' | 'down' | 'stable';
  change?: 'up' | 'down' | 'stable';
  changeRate?: string;
  country: string;
  contactPhone?: string;
  assignedAdminName?: string;
  officeName?: string;
  updatedAt?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  currencySymbol: string;
  category: 'all' | 'foodstuffs' | 'oils' | 'sugar' | 'rice' | 'flour' | 'oil' | 'other';
  categoryAr: string;
  imageUrl: string;
  image?: string;
  isAvailable: boolean;
  inStock?: boolean;
  unit: string;
  whatsappMessage: string;
  description?: string;
  supplierIds?: string[];
  updatedAt?: number;
}

export type UserRoleType = 'admin_full' | 'admin' | 'supervisor' | 'supplier' | 'product_editor' | 'currency_manager';

export interface AdminUser {
  id: string;
  name: string;
  email?: string;
  role: UserRoleType;
  pin?: string; // 8-digit PIN code (e.g. 20268800)
  hashedPassword?: string;
  phone?: string;
  createdAt?: number;
  updatedAt?: number;
  assignedCurrency?: string; // e.g. currency code like 'USD', 'EGP' or 'all'
  assignedProduct?: string;  // e.g. category like 'sugar', 'oils' or product ID or 'all'
  whatsappPhone?: string;    // WhatsApp contact phone for this admin
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  pin?: string; // 8-digit PIN code
  contactInfo?: {
    phone: string;
    email?: string;
    address?: string;
  };
  assignedProducts?: string[]; // Product IDs or names handled by this supplier
  warehouseAddress?: string;
  status: 'active' | 'inactive';
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface SchemaProduct {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  images: string[];
  supplierIds: string[];
  status: 'active' | 'inactive' | 'draft';
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
  unit?: string;
  category?: 'all' | 'foodstuffs' | 'oils' | 'sugar' | 'rice' | 'other';
}

export interface CurrencyRate {
  id: string;
  currencyCode: string;
  rateToBase: number;
  lastUpdated?: number;
  updatedBy?: string;
  contactPhone?: string;      // Specific WhatsApp phone number for this currency
  assignedAdminId?: string;   // Assigned admin user ID
  assignedSupplierId?: string;// Assigned exchange office or supplier ID
  officeName?: string;        // Office or manager name e.g. "مكتب تحويلات العاصمة"
}

export type ScreenId = 'splash' | 'onboarding' | 'home' | 'products' | 'prices' | 'settings';

export interface CommunityLink {
  id: string;
  title: string;
  description?: string;
  platform: 'whatsapp_group' | 'whatsapp_channel' | 'telegram' | 'facebook' | 'phone' | 'other';
  url: string;
  badgeText?: string;
  isFeatured?: boolean;
}

export interface WhatsAppConfig {
  salesPhone1: string;
  salesPhone2: string;
  supportPhone: string;
  emergencyPhone: string;
  waLink: string;
  groupLink: string;
  channelLink: string;
  telegramLink?: string;
  facebookLink?: string;
  defaultMessage: string;
  communityTitle?: string;
  communityDescription?: string;
  communityLinks?: CommunityLink[];
}

export interface AppSettings {
  language: 'ar' | 'en';
  baseCurrencyId: string;
  notificationsEnabled: boolean;
  autoUpdateIntervalMinutes: number;
}

export interface Order {
  id: string;
  productName: string;
  price: string;
  unit: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'contacted' | 'completed' | 'cancelled';
  customerName: string;
  customerPhone: string;
  notes?: string;
  createdAt?: number;
}

export interface SystemAlert {
  id: string;
  title: string;
  text: string;
  time: string;
  unread: boolean;
  createdAt: number;
}

export interface ClientUser {
  id: string;
  name: string;
  phone: string;
  city?: string;
  accountType: 'individual' | 'merchant'; // أفراد أو تاجر جملة
  registeredAt: number;
  password?: string;
  email?: string;
}


