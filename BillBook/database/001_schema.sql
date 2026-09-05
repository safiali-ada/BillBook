-- 001_schema.sql
-- Create core schema for BillBook application

-- Create enums
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'FINALIZED', 'PAID', 'CANCELLED');
CREATE TYPE transaction_type AS ENUM ('SALE', 'PURCHASE', 'MANUAL_ADJUSTMENT', 'RETURN', 'CANCELLATION', 'CORRECTION');
CREATE TYPE discount_type AS ENUM ('NONE', 'PERCENTAGE', 'FIXED');

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Businesses
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    gstin TEXT,
    logo_url TEXT,
    invoice_prefix TEXT DEFAULT 'INV',
    invoice_number_start INTEGER DEFAULT 1,
    currency TEXT DEFAULT 'INR',
    allow_negative_stock BOOLEAN DEFAULT false,
    default_gst_rate NUMERIC(5,2) DEFAULT 0,
    low_stock_default INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER set_timestamp_businesses BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    business_id UUID REFERENCES businesses(id),
    role TEXT DEFAULT 'owner',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    name TEXT NOT NULL,
    sku TEXT,
    description TEXT,
    category TEXT,
    unit TEXT DEFAULT 'pcs',
    selling_price NUMERIC(12,2) NOT NULL CHECK (selling_price >= 0),
    cost_price NUMERIC(12,2) CHECK (cost_price >= 0),
    gst_rate NUMERIC(5,2) DEFAULT 0 CHECK (gst_rate >= 0 AND gst_rate <= 100),
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, sku)
);
CREATE TRIGGER set_timestamp_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    gstin TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER set_timestamp_customers BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    customer_id UUID REFERENCES customers(id),
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status invoice_status DEFAULT 'DRAFT',
    subtotal NUMERIC(12,2) DEFAULT 0,
    item_discount_total NUMERIC(12,2) DEFAULT 0,
    invoice_discount_type discount_type DEFAULT 'NONE',
    invoice_discount_value NUMERIC(12,2) DEFAULT 0,
    invoice_discount_amount NUMERIC(12,2) DEFAULT 0,
    taxable_amount NUMERIC(12,2) DEFAULT 0,
    gst_enabled BOOLEAN DEFAULT false,
    gst_rate NUMERIC(5,2) DEFAULT 0,
    gst_amount NUMERIC(12,2) DEFAULT 0,
    grand_total NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    customer_name_snapshot TEXT,
    customer_phone_snapshot TEXT,
    customer_address_snapshot TEXT,
    customer_gstin_snapshot TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, invoice_number)
);
CREATE TRIGGER set_timestamp_invoices BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Invoice Items
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name_snapshot TEXT NOT NULL,
    sku_snapshot TEXT,
    unit_snapshot TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    original_price NUMERIC(12,2) NOT NULL,
    selling_price NUMERIC(12,2) NOT NULL CHECK (selling_price >= 0),
    discount_type discount_type DEFAULT 'NONE',
    discount_value NUMERIC(12,2) DEFAULT 0 CHECK (discount_value >= 0),
    discount_amount NUMERIC(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    subtotal NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    gst_rate_snapshot NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory Transactions
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    product_id UUID NOT NULL REFERENCES products(id),
    transaction_type transaction_type NOT NULL,
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    reason TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);
