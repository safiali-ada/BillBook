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
