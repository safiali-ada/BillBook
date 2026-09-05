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
