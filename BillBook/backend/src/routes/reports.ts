import { Hono } from 'hono';
import { Env, UserContext } from '../types';
import { createSupabaseClient } from '../lib/supabase';
import { ValidationError } from '../lib/errors';

const reportRoutes = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

reportRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user.businessId) throw new ValidationError('Please complete business setup first.');
  await next();
});

reportRoutes.get('/summary', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  const today = new Date().toISOString().split('T')[0];

  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .eq('business_id', user.businessId)
    .eq('invoice_date', today)
    .in('status', ['FINALIZED', 'PAID']);
    
  if (invError) throw new ValidationError(invError.message);

  const todaySales = invoices.reduce((sum, i) => sum + i.grand_total, 0);
  const todayInvoices = invoices.length;

  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', user.businessId);

  const { data: recentInvoices } = await supabase
    .from('invoices')
    .select('*, customer:customers(name)')
    .eq('business_id', user.businessId)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: lowStock } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', user.businessId)
    .limit(5); // In a real app, use a proper low stock query

  return c.json({
    success: true,
    data: {
      today_sales: todaySales,
      invoices_today: todayInvoices,
      total_products: productCount || 0,
      low_stock_count: lowStock?.length || 0,
      recent_invoices: recentInvoices || [],
      low_stock_products: lowStock || []
    }
  });
});

reportRoutes.get('/sales', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  
  const from_date = c.req.query('from_date');
  const to_date = c.req.query('to_date');

  let query = supabase.from('invoices').select('*').eq('business_id', user.businessId).in('status', ['FINALIZED', 'PAID']);
  if (from_date) query = query.gte('invoice_date', from_date);
  if (to_date) query = query.lte('invoice_date', to_date);

  const { data, error } = await query;
  if (error) throw new ValidationError(error.message);

  const total_sales = data.reduce((sum, i) => sum + i.grand_total, 0);
  const invoice_count = data.length;
  const avg_value = invoice_count > 0 ? total_sales / invoice_count : 0;

  // Daily breakdown
  const dailyMap: Record<string, number> = {};
  data.forEach(inv => {
    const d = inv.invoice_date;
    dailyMap[d] = (dailyMap[d] || 0) + inv.grand_total;
  });
  
  const daily = Object.keys(dailyMap).sort().map(date => ({
    date,
    sales: dailyMap[date]
  }));

  return c.json({
    success: true,
    data: { total_sales, invoice_count, avg_value, daily }
  });
});

reportRoutes.get('/top-products', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  
  // Fetch items from finalized invoices
  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('id')
    .eq('business_id', user.businessId)
    .in('status', ['FINALIZED', 'PAID']);
    
  if (invError) throw new ValidationError(invError.message);
  
  if (!invoices || invoices.length === 0) {
    return c.json({ success: true, data: [] });
  }

  const invoiceIds = invoices.map(i => i.id);
  
  // Need to fetch in chunks if array is huge, but fine for now
  const { data: items, error: itemError } = await supabase
    .from('invoice_items')
    .select('product_name_snapshot, quantity, total')
    .in('invoice_id', invoiceIds);

  if (itemError) throw new ValidationError(itemError.message);

  const productStats: Record<string, { name: string, quantity: number, revenue: number }> = {};
  
  items?.forEach(item => {
    const name = item.product_name_snapshot;
    if (!productStats[name]) {
      productStats[name] = { name, quantity: 0, revenue: 0 };
    }
    productStats[name].quantity += item.quantity;
    productStats[name].revenue += item.total;
  });

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return c.json({ success: true, data: topProducts });
});

export default reportRoutes;
