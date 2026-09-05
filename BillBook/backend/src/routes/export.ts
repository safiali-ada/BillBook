import { Hono } from 'hono';
import { Env, UserContext } from '../types';
import { createSupabaseClient } from '../lib/supabase';
import { ValidationError } from '../lib/errors';

const exportRoutes = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

exportRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user.businessId) throw new ValidationError('Please complete business setup first.');
  await next();
});

exportRoutes.get('/products', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  
  const { data, error } = await supabase.from('products').select('*').eq('business_id', user.businessId);
  if (error) throw new ValidationError(error.message);

  const csv = [
    ['ID', 'Name', 'SKU', 'Category', 'Price'].join(','),
    ...data.map((p: any) => [p.id, p.name, p.sku || '', p.category || '', p.selling_price].join(','))
  ].join('\n');

  c.header('Content-Type', 'text/csv');
  c.header('Content-Disposition', 'attachment; filename="products.csv"');
  return c.body(csv);
});

exportRoutes.get('/customers', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  
  const { data, error } = await supabase.from('customers').select('*').eq('business_id', user.businessId);
  if (error) throw new ValidationError(error.message);

  const csv = [
    ['ID', 'Name', 'Phone', 'Email'].join(','),
    ...data.map((c: any) => [c.id, c.name, c.phone || '', c.email || ''].join(','))
  ].join('\n');

  c.header('Content-Type', 'text/csv');
  c.header('Content-Disposition', 'attachment; filename="customers.csv"');
  return c.body(csv);
});

exportRoutes.get('/invoices', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  
  const { data, error } = await supabase.from('invoices').select('*').eq('business_id', user.businessId);
  if (error) throw new ValidationError(error.message);

  const csv = [
    ['ID', 'Invoice Number', 'Date', 'Status', 'Total'].join(','),
    ...data.map((i: any) => [i.id, i.invoice_number, i.invoice_date, i.status, i.grand_total].join(','))
  ].join('\n');

  c.header('Content-Type', 'text/csv');
  c.header('Content-Disposition', 'attachment; filename="invoices.csv"');
  return c.body(csv);
});

exportRoutes.get('/inventory', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  
  const { data, error } = await supabase.from('inventory_transactions').select('*').eq('business_id', user.businessId);
  if (error) throw new ValidationError(error.message);

  const csv = [
    ['ID', 'Product ID', 'Type', 'Quantity', 'Date'].join(','),
    ...data.map((t: any) => [t.id, t.product_id, t.transaction_type, t.quantity, t.created_at].join(','))
  ].join('\n');

  c.header('Content-Type', 'text/csv');
  c.header('Content-Disposition', 'attachment; filename="inventory.csv"');
  return c.body(csv);
});

export default exportRoutes;
