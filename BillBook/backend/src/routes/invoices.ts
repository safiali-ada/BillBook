import { Hono } from 'hono';
import { Env, UserContext, CreateInvoiceRequest } from '../types';
import { createSupabaseClient } from '../lib/supabase';
import { ValidationError, NotFoundError } from '../lib/errors';
import { calculateFullInvoice } from '../services/calculations';

const invoiceRoutes = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

invoiceRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user.businessId) throw new ValidationError('Please complete business setup first.');
  await next();
});

// List invoices
invoiceRoutes.get('/', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);

  const page = parseInt(c.req.query('page') || '1', 10);
  const pageSize = Math.min(parseInt(c.req.query('pageSize') || '20', 10), 100);
  const status = c.req.query('status');
  const customer_id = c.req.query('customer_id');
  const search = c.req.query('search');
  const from_date = c.req.query('from_date');
  const to_date = c.req.query('to_date');

  let query = supabase
    .from('invoices')
    .select('*, customer:customers(name, phone)', { count: 'exact' })
    .eq('business_id', user.businessId);

  if (status) query = query.eq('status', status);
  if (customer_id) query = query.eq('customer_id', customer_id);
  if (search) query = query.ilike('invoice_number', `%${search}%`);
  if (from_date) query = query.gte('invoice_date', from_date);
  if (to_date) query = query.lte('invoice_date', to_date);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new ValidationError(error.message);

  return c.json({
    success: true,
    data,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
});

// Create draft invoice
invoiceRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body: CreateInvoiceRequest = await c.req.json();
  const supabase = createSupabaseClient(c.env);

  if (!body.items || body.items.length === 0) {
    throw new ValidationError('Invoice must have at least one item.');
  }

  // Validate items
  for (const item of body.items) {
    if (!item.product_id) throw new ValidationError('Each item must have a product.');
    if (!item.quantity || item.quantity <= 0) throw new ValidationError('Quantity must be greater than zero.');
    if (item.selling_price < 0) throw new ValidationError('Price cannot be negative.');
  }

  // Fetch product details
  const productIds = body.items.map((i) => i.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('business_id', user.businessId);

  if (!products || products.length !== new Set(productIds).size) {
    throw new ValidationError('One or more products not found.');
  }
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  // Calculate totals using authoritative calculation service
  const calcItems = body.items.map((item) => ({
    quantity: item.quantity,
    selling_price: item.selling_price,
    discount_type: item.discount_type || ('NONE' as const),
    discount_value: item.discount_value || 0,
  }));

  const calcResult = calculateFullInvoice(
    calcItems,
    body.invoice_discount_type || 'NONE',
    body.invoice_discount_value || 0,
    body.gst_enabled || false,
    body.gst_rate || 0
  );

  // Generate invoice number using the database function (atomic, race-safe)
  const { data: invoiceNumberResult, error: numberError } = await supabase.rpc(
    'generate_invoice_number',
    { p_business_id: user.businessId }
  );

  if (numberError) throw new ValidationError('Failed to generate invoice number: ' + numberError.message);
  const invoice_number = invoiceNumberResult as string;

  // Snapshot customer info
  let customerSnapshot: Record<string, string | null> = {};
  if (body.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', body.customer_id)
      .eq('business_id', user.businessId)
      .single();
    if (customer) {
      customerSnapshot = {
        customer_name_snapshot: customer.name,
        customer_phone_snapshot: customer.phone,
        customer_address_snapshot: customer.address,
        customer_gstin_snapshot: customer.gstin,
      };
    }
  }

  // Insert invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert([
      {
        business_id: user.businessId,
        customer_id: body.customer_id || null,
        invoice_number,
        invoice_date: body.invoice_date || new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        subtotal: calcResult.subtotal,
        item_discount_total: calcResult.item_discount_total,
        invoice_discount_type: body.invoice_discount_type || 'NONE',
        invoice_discount_value: body.invoice_discount_value || 0,
        invoice_discount_amount: calcResult.invoice_discount_amount,
        taxable_amount: calcResult.taxable_amount,
        gst_enabled: body.gst_enabled || false,
        gst_rate: body.gst_rate || 0,
        gst_amount: calcResult.gst_amount,
        grand_total: calcResult.grand_total,
        notes: body.notes || '',
        ...customerSnapshot,
        created_by: user.userId,
      },
    ])
    .select()
    .single();

  if (invoiceError) throw new ValidationError(invoiceError.message);

  // Insert invoice items with snapshots
  const invoiceItemsToInsert = body.items.map((item, idx) => ({
    invoice_id: invoice.id,
    product_id: item.product_id,
    product_name_snapshot: productMap[item.product_id].name,
    sku_snapshot: productMap[item.product_id].sku,
    unit_snapshot: productMap[item.product_id].unit,
    quantity: item.quantity,
    original_price: productMap[item.product_id].selling_price,
    selling_price: item.selling_price,
    discount_type: item.discount_type || 'NONE',
    discount_value: item.discount_value || 0,
    discount_amount: calcResult.items[idx].discount_amount,
    subtotal: calcResult.items[idx].subtotal,
    total: calcResult.items[idx].total,
    gst_rate_snapshot: productMap[item.product_id].gst_rate,
  }));

  const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItemsToInsert);
  if (itemsError) throw new ValidationError(itemsError.message);

  return c.json({ success: true, data: invoice }, 201);
});

// Get single invoice with items
invoiceRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);

  const { data, error } = await supabase
    .from('invoices')
    .select('*, items:invoice_items(*), customer:customers(*)')
    .eq('id', c.req.param('id'))
    .eq('business_id', user.businessId)
    .single();

  if (error || !data) throw new NotFoundError('Invoice');
  return c.json({ success: true, data });
});

// Update draft invoice (full replacement of items)
invoiceRoutes.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body: CreateInvoiceRequest = await c.req.json();
  const supabase = createSupabaseClient(c.env);

  // Verify invoice exists and is DRAFT
  const { data: existing } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('business_id', user.businessId)
    .single();

  if (!existing) throw new NotFoundError('Invoice');
  if (existing.status !== 'DRAFT') throw new ValidationError('Only DRAFT invoices can be updated.');

  if (!body.items || body.items.length === 0) {
    throw new ValidationError('Invoice must have at least one item.');
  }

  // Validate items
  for (const item of body.items) {
    if (!item.product_id) throw new ValidationError('Each item must have a product.');
    if (!item.quantity || item.quantity <= 0) throw new ValidationError('Quantity must be greater than zero.');
    if (item.selling_price < 0) throw new ValidationError('Price cannot be negative.');
  }

  // Fetch products
  const productIds = body.items.map((i) => i.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('business_id', user.businessId);

  if (!products || products.length !== new Set(productIds).size) {
    throw new ValidationError('One or more products not found.');
  }
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  // Recalculate
  const calcItems = body.items.map((item) => ({
    quantity: item.quantity,
    selling_price: item.selling_price,
    discount_type: item.discount_type || ('NONE' as const),
    discount_value: item.discount_value || 0,
  }));

  const calcResult = calculateFullInvoice(
    calcItems,
    body.invoice_discount_type || 'NONE',
    body.invoice_discount_value || 0,
    body.gst_enabled || false,
    body.gst_rate || 0
  );

  // Snapshot customer
  let customerSnapshot: Record<string, string | null> = {};
  if (body.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', body.customer_id)
      .eq('business_id', user.businessId)
      .single();
    if (customer) {
      customerSnapshot = {
        customer_name_snapshot: customer.name,
        customer_phone_snapshot: customer.phone,
        customer_address_snapshot: customer.address,
        customer_gstin_snapshot: customer.gstin,
      };
    }
  }

  // Delete old items (cascade would handle this, but explicit is clearer)
  await supabase.from('invoice_items').delete().eq('invoice_id', id);

  // Update invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .update({
      customer_id: body.customer_id || null,
      invoice_date: body.invoice_date || existing.invoice_date,
      subtotal: calcResult.subtotal,
      item_discount_total: calcResult.item_discount_total,
      invoice_discount_type: body.invoice_discount_type || 'NONE',
      invoice_discount_value: body.invoice_discount_value || 0,
      invoice_discount_amount: calcResult.invoice_discount_amount,
      taxable_amount: calcResult.taxable_amount,
      gst_enabled: body.gst_enabled || false,
      gst_rate: body.gst_rate || 0,
      gst_amount: calcResult.gst_amount,
      grand_total: calcResult.grand_total,
      notes: body.notes || '',
      ...customerSnapshot,
    })
    .eq('id', id)
    .select()
    .single();

  if (invoiceError) throw new ValidationError(invoiceError.message);

  // Insert new items
  const invoiceItemsToInsert = body.items.map((item, idx) => ({
    invoice_id: id,
    product_id: item.product_id,
    product_name_snapshot: productMap[item.product_id].name,
    sku_snapshot: productMap[item.product_id].sku,
    unit_snapshot: productMap[item.product_id].unit,
    quantity: item.quantity,
    original_price: productMap[item.product_id].selling_price,
    selling_price: item.selling_price,
    discount_type: item.discount_type || 'NONE',
    discount_value: item.discount_value || 0,
    discount_amount: calcResult.items[idx].discount_amount,
    subtotal: calcResult.items[idx].subtotal,
    total: calcResult.items[idx].total,
    gst_rate_snapshot: productMap[item.product_id].gst_rate,
  }));

  const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItemsToInsert);
  if (itemsError) throw new ValidationError(itemsError.message);

  return c.json({ success: true, data: invoice });
});

// Finalize invoice
invoiceRoutes.post('/:id/finalize', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);

  const { data, error } = await supabase.rpc('finalize_invoice', {
    p_invoice_id: c.req.param('id'),
    p_user_id: user.userId,
  });

  if (error) {
    // Parse PostgreSQL error messages for user-friendly display
    const msg = error.message || 'Failed to finalize invoice.';
    if (msg.includes('Insufficient stock')) {
      throw new ValidationError(msg);
    }
    if (msg.includes('Only DRAFT')) {
      throw new ValidationError('This invoice has already been finalized.');
    }
    throw new ValidationError(msg);
  }

  // Fetch the updated invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, items:invoice_items(*), customer:customers(*)')
    .eq('id', c.req.param('id'))
    .single();

  return c.json({ success: true, data: invoice });
});

// Cancel invoice
invoiceRoutes.post('/:id/cancel', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);

  const { data, error } = await supabase.rpc('cancel_invoice', {
    p_invoice_id: c.req.param('id'),
    p_user_id: user.userId,
  });

  if (error) {
    const msg = error.message || 'Failed to cancel invoice.';
    if (msg.includes('Only FINALIZED')) {
      throw new ValidationError('Only finalized invoices can be cancelled.');
    }
    throw new ValidationError(msg);
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, items:invoice_items(*), customer:customers(*)')
    .eq('id', c.req.param('id'))
    .single();

  return c.json({ success: true, data: invoice });
});

// Delete draft invoice
invoiceRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const supabase = createSupabaseClient(c.env);

  // Verify invoice exists and is DRAFT
  const { data: existing, error: fetchError } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', id)
    .eq('business_id', user.businessId)
    .single();

  if (fetchError || !existing) throw new NotFoundError('Invoice');
  if (existing.status !== 'DRAFT') {
    throw new ValidationError('Only DRAFT invoices can be deleted. Cancel finalized invoices instead.');
  }

  // Delete items first just to be safe if cascade isn't on
  const { error: itemsError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', id);
  if (itemsError) throw new ValidationError(itemsError.message);

  const { error: invoiceError } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('business_id', user.businessId);
  if (invoiceError) throw new ValidationError(invoiceError.message);

  return c.json({ success: true, message: 'Draft invoice deleted successfully.' });
});

export default invoiceRoutes;
