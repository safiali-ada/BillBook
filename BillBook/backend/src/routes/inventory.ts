import { Hono } from 'hono';
import { Env, UserContext } from '../types';
import { createSupabaseClient } from '../lib/supabase';
import { ValidationError } from '../lib/errors';

const inventoryRoutes = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

inventoryRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user.businessId) throw new ValidationError('Please complete business setup first.');
  await next();
});

inventoryRoutes.get('/', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  
  const filter = c.req.query('filter') || 'all'; 
  const search = c.req.query('search') || '';
  const page = parseInt(c.req.query('page') || '1', 10);
  const pageSize = Math.min(parseInt(c.req.query('pageSize') || '20', 10), 100);

  let query = supabase.from('products').select('*').eq('business_id', user.businessId).order('name');
  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw new ValidationError(error.message);

  let filteredData = data || [];
  if (filter === 'out_of_stock') {
    filteredData = filteredData.filter(p => p.stock_quantity <= 0);
  } else if (filter === 'low_stock') {
    filteredData = filteredData.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 10));
  }

  const total = filteredData.length;
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const paginatedData = filteredData.slice(from, to);

  return c.json({
    success: true,
    data: paginatedData,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  });
});

inventoryRoutes.post('/adjust', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const supabase = createSupabaseClient(c.env);

  if (!body.product_id) throw new ValidationError('product_id is required');
  if (typeof body.quantity !== 'number') throw new ValidationError('quantity must be a number');
  if (!body.reason) throw new ValidationError('reason is required');

  const { data, error } = await supabase.rpc('adjust_inventory', {
    p_product_id: body.product_id,
    p_quantity: body.quantity,
    p_reason: body.reason,
    p_user_id: user.userId
  });

  if (error) throw new ValidationError(error.message);
  return c.json({ success: true, data });
});

inventoryRoutes.get('/:productId/history', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  const productId = c.req.param('productId');
  const page = parseInt(c.req.query('page') || '1', 10);
  const pageSize = Math.min(parseInt(c.req.query('pageSize') || '20', 10), 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from('inventory_transactions')
    .select('*', { count: 'exact' })
    .eq('product_id', productId)
    .eq('business_id', user.businessId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new ValidationError(error.message);
  return c.json({
    success: true,
    data,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  });
});

export default inventoryRoutes;
