export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const GST_RATES = [0, 5, 12, 18, 28] as const;

export const INVOICE_STATUSES = ['DRAFT', 'FINALIZED', 'PAID', 'CANCELLED'] as const;

export const PRODUCT_UNITS = ['pcs', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'ft', 'box', 'pack', 'set', 'pair', 'dozen'] as const;

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';
export const CURRENCY_LOCALE = 'en-IN';
