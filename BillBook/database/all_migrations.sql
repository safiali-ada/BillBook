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
-- 002_rls_policies.sql
-- Create Row Level Security policies

-- Helper function to get the current user's business_id from profiles
CREATE OR REPLACE FUNCTION get_user_business_id()
RETURNS UUID AS $$
DECLARE
    v_business_id UUID;
BEGIN
    SELECT business_id INTO v_business_id FROM profiles WHERE id = auth.uid();
    RETURN v_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Force RLS
ALTER TABLE businesses FORCE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE invoice_items FORCE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions FORCE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (id = auth.uid());

-- Businesses: Users can access their own business
CREATE POLICY "Users access own business" ON businesses FOR ALL USING (id = get_user_business_id());

-- Products
CREATE POLICY "Users access own business products" ON products FOR ALL USING (business_id = get_user_business_id());

-- Customers
CREATE POLICY "Users access own business customers" ON customers FOR ALL USING (business_id = get_user_business_id());

-- Invoices
CREATE POLICY "Users access own business invoices" ON invoices FOR ALL USING (business_id = get_user_business_id());

-- Invoice Items: access through invoice's business_id
CREATE POLICY "Users access own invoice items" ON invoice_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM invoices 
        WHERE invoices.id = invoice_items.invoice_id AND invoices.business_id = get_user_business_id()
    )
);

-- Inventory Transactions
CREATE POLICY "Users access own inventory transactions" ON inventory_transactions FOR ALL USING (business_id = get_user_business_id());
-- 003_functions.sql
-- Core business logic functions

-- generate_invoice_number
CREATE OR REPLACE FUNCTION generate_invoice_number(p_business_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_year TEXT;
    v_current_max TEXT;
    v_next_num INTEGER;
    v_start_num INTEGER;
    v_result TEXT;
BEGIN
    -- Advisory lock to prevent race conditions based on business_id (using a hash)
    PERFORM pg_advisory_xact_lock(hashtext(p_business_id::text));
    
    SELECT invoice_prefix, invoice_number_start INTO v_prefix, v_start_num
    FROM businesses WHERE id = p_business_id;
    
    v_year := to_char(CURRENT_DATE, 'YYYY');
    
    SELECT invoice_number INTO v_current_max
    FROM invoices
    WHERE business_id = p_business_id 
      AND invoice_number LIKE v_prefix || '-' || v_year || '-%'
    ORDER BY LENGTH(invoice_number) DESC, invoice_number DESC
    LIMIT 1;
    
    IF v_current_max IS NULL THEN
        v_next_num := v_start_num;
    ELSE
        v_next_num := CAST(SUBSTRING(v_current_max FROM '\d+$') AS INTEGER) + 1;
    END IF;
    
    v_result := v_prefix || '-' || v_year || '-' || LPAD(v_next_num::TEXT, 5, '0');
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;


-- finalize_invoice
CREATE OR REPLACE FUNCTION finalize_invoice(p_invoice_id UUID, p_user_id UUID)
RETURNS invoices AS $$
DECLARE
    v_invoice invoices;
    v_item RECORD;
    v_product RECORD;
    v_allow_negative BOOLEAN;
BEGIN
    -- Get invoice
    SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;
    
    IF v_invoice.status != 'DRAFT' THEN
        RAISE EXCEPTION 'Only DRAFT invoices can be finalized';
    END IF;
    
    SELECT allow_negative_stock INTO v_allow_negative FROM businesses WHERE id = v_invoice.business_id;
    
    -- Process items
    FOR v_item IN SELECT * FROM invoice_items WHERE invoice_id = p_invoice_id LOOP
        IF v_item.product_id IS NOT NULL THEN
            SELECT * INTO v_product FROM products WHERE id = v_item.product_id;
            
            IF NOT v_allow_negative AND (v_product.stock_quantity - v_item.quantity < 0) THEN
                RAISE EXCEPTION 'Insufficient stock for product %', v_product.name;
            END IF;
            
            UPDATE products 
            SET stock_quantity = stock_quantity - v_item.quantity
            WHERE id = v_item.product_id;
            
            INSERT INTO inventory_transactions (
                business_id, product_id, transaction_type, quantity, 
                previous_stock, new_stock, reference_type, reference_id, created_by
            ) VALUES (
                v_invoice.business_id, v_item.product_id, 'SALE', -v_item.quantity,
                v_product.stock_quantity, v_product.stock_quantity - v_item.quantity,
                'INVOICE', p_invoice_id, p_user_id
            );
        END IF;
    END LOOP;
    
    UPDATE invoices SET status = 'FINALIZED', updated_at = NOW() WHERE id = p_invoice_id
    RETURNING * INTO v_invoice;
    
    RETURN v_invoice;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- cancel_invoice
CREATE OR REPLACE FUNCTION cancel_invoice(p_invoice_id UUID, p_user_id UUID)
RETURNS invoices AS $$
DECLARE
    v_invoice invoices;
    v_item RECORD;
    v_product RECORD;
BEGIN
    SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;
    
    IF v_invoice.status != 'FINALIZED' THEN
        RAISE EXCEPTION 'Only FINALIZED invoices can be cancelled';
    END IF;
    
    FOR v_item IN SELECT * FROM invoice_items WHERE invoice_id = p_invoice_id LOOP
        IF v_item.product_id IS NOT NULL THEN
            SELECT * INTO v_product FROM products WHERE id = v_item.product_id;
            
            UPDATE products 
            SET stock_quantity = stock_quantity + v_item.quantity
            WHERE id = v_item.product_id;
            
            INSERT INTO inventory_transactions (
                business_id, product_id, transaction_type, quantity, 
                previous_stock, new_stock, reference_type, reference_id, created_by
            ) VALUES (
                v_invoice.business_id, v_item.product_id, 'CANCELLATION', v_item.quantity,
                v_product.stock_quantity, v_product.stock_quantity + v_item.quantity,
                'INVOICE', p_invoice_id, p_user_id
            );
        END IF;
    END LOOP;
    
    UPDATE invoices SET status = 'CANCELLED', updated_at = NOW() WHERE id = p_invoice_id
    RETURNING * INTO v_invoice;
    
    RETURN v_invoice;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- adjust_inventory
CREATE OR REPLACE FUNCTION adjust_inventory(p_product_id UUID, p_quantity INTEGER, p_reason TEXT, p_user_id UUID)
RETURNS products AS $$
DECLARE
    v_product products;
    v_allow_negative BOOLEAN;
    v_new_stock INTEGER;
BEGIN
    SELECT * INTO v_product FROM products WHERE id = p_product_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
    END IF;
    
    SELECT allow_negative_stock INTO v_allow_negative FROM businesses WHERE id = v_product.business_id;
    
    v_new_stock := v_product.stock_quantity + p_quantity;
    
    IF NOT v_allow_negative AND v_new_stock < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Adjustment leads to negative stock which is not allowed.';
    END IF;
    
    UPDATE products 
    SET stock_quantity = v_new_stock, updated_at = NOW()
    WHERE id = p_product_id;
    
    INSERT INTO inventory_transactions (
        business_id, product_id, transaction_type, quantity, 
        previous_stock, new_stock, reference_type, reason, created_by
    ) VALUES (
        v_product.business_id, p_product_id, 'MANUAL_ADJUSTMENT', p_quantity,
        v_product.stock_quantity, v_new_stock, 'MANUAL', p_reason, p_user_id
    );
    
    SELECT * INTO v_product FROM products WHERE id = p_product_id;
    RETURN v_product;
END;
$$ LANGUAGE plpgsql;
-- 004_indexes.sql
-- Create performance indexes

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Products
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin(name gin_trgm_ops);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Invoice Items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);

-- Inventory Transactions
CREATE INDEX IF NOT EXISTS idx_inventory_tx_business_id ON inventory_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_product_id ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_created_at ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_type ON inventory_transactions(transaction_type);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON profiles(business_id);
