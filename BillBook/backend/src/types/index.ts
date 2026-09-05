export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  ENVIRONMENT: string;
}

export interface UserContext {
  userId: string;
  email: string;
  businessId: string;
}

// Invoice status enum
export type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'PAID' | 'CANCELLED';

// Transaction types
export type TransactionType = 'SALE' | 'PURCHASE' | 'MANUAL_ADJUSTMENT' | 'RETURN' | 'CANCELLATION' | 'CORRECTION';

// Discount types
export type DiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED';

// Full model types
export interface Business {
  id: string;
  business_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  logo_url: string | null;
  invoice_prefix: string;
  invoice_number_start: number;
  currency: string;
  allow_negative_stock: boolean;
  default_gst_rate: number;
  low_stock_default: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  business_id: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  unit: string;
  selling_price: number;
  cost_price: number | null;
  gst_rate: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  customer_id: string | null;
  invoice_number: string;
  invoice_date: string;
  status: InvoiceStatus;
  subtotal: number;
  item_discount_total: number;
  invoice_discount_type: DiscountType;
  invoice_discount_value: number;
  invoice_discount_amount: number;
  taxable_amount: number;
  gst_enabled: boolean;
  gst_rate: number;
  gst_amount: number;
  grand_total: number;
  notes: string | null;
  customer_name_snapshot: string | null;
  customer_phone_snapshot: string | null;
  customer_address_snapshot: string | null;
  customer_gstin_snapshot: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  items?: InvoiceItem[];
  customer?: Customer;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  unit_snapshot: string | null;
  quantity: number;
  original_price: number;
  selling_price: number;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  subtotal: number;
  total: number;
  gst_rate_snapshot: number;
  created_at: string;
}

export interface InventoryTransaction {
  id: string;
  business_id: string;
  product_id: string;
  transaction_type: TransactionType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  // Joined
  product?: Product;
}

// API request/response types
export interface CreateInvoiceRequest {
  customer_id?: string;
  invoice_date?: string;
  items: CreateInvoiceItemRequest[];
  invoice_discount_type?: DiscountType;
  invoice_discount_value?: number;
  gst_enabled?: boolean;
  gst_rate?: number;
  notes?: string;
}

export interface CreateInvoiceItemRequest {
  product_id: string;
  quantity: number;
  selling_price: number;
  discount_type?: DiscountType;
  discount_value?: number;
}

export interface AdjustInventoryRequest {
  product_id: string;
  quantity: number;
  reason: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
