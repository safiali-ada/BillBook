import { Hono } from 'hono';
import { Env, UserContext } from '../types';
import { createSupabaseClient } from '../lib/supabase';
import { ValidationError, NotFoundError } from '../lib/errors';

const customerRoutes = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

customerRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user.businessId) throw new ValidationError('Please complete business setup first.');
  await next();
});

customerRoutes.get('/', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  
  const page = parseInt(c.req.query('page') || '1', 10);
  const pageSize = Math.min(parseInt(c.req.query('pageSize') || '20', 10), 100);
  const search = c.req.query('search');

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('business_id', user.businessId);

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('name', { ascending: true })
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

customerRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const supabase = createSupabaseClient(c.env);

  if (!body.name) throw new ValidationError('name is required');

  const { data, error } = await supabase
    .from('customers')
    .insert([{ ...body, business_id: user.businessId }])
    .select()
    .single();

  if (error) throw new ValidationError(error.message);
  return c.json({ success: true, data });
});

customerRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', c.req.param('id'))
    .eq('business_id', user.businessId)
    .single();

  if (error || !customer) throw new NotFoundError('Customer');

  const { data: invoices } = await supabase
    .from('invoices')
    .select('status, grand_total')
    .eq('customer_id', customer.id);

  let total_spent = 0;
  let total_invoices = 0;
  if (invoices) {
    total_invoices = invoices.length;
    total_spent = invoices
      .filter(i => i.status === 'FINALIZED' || i.status === 'PAID')
      .reduce((sum, i) => sum + i.grand_total, 0);
  }

  return c.json({ success: true, data: { ...customer, summary: { total_spent, total_invoices } } });
});

customerRoutes.patch('/:id', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const supabase = createSupabaseClient(c.env);
  
  const { data, error } = await supabase
    .from('customers')
    .update(body)
    .eq('id', c.req.param('id'))
    .eq('business_id', user.businessId)
    .select()
    .single();

  if (error) throw new ValidationError(error.message);
  return c.json({ success: true, data });
});

export default customerRoutes;
