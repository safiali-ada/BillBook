import { Hono } from 'hono';
import { Env, UserContext, Product } from '../types';
import { createSupabaseClient } from '../lib/supabase';
import { ValidationError, NotFoundError } from '../lib/errors';

const productRoutes = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

productRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user.businessId) {
    throw new ValidationError('Please complete business setup first.');
  }
  await next();
});

productRoutes.get('/', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  
  const page = parseInt(c.req.query('page') || '1', 10);
  const pageSize = Math.min(parseInt(c.req.query('pageSize') || '20', 10), 100);
  const search = c.req.query('search');
  const category = c.req.query('category');
  const active = c.req.query('active');

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('business_id', user.businessId);

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (active !== undefined) {
    query = query.eq('is_active', active === 'true');
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(from, to);

  if (error) {
    throw new ValidationError(error.message);
  }

  return c.json({
    success: true,
    data,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  });
});

productRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const supabase = createSupabaseClient(c.env);

  if (!body.name) throw new ValidationError('name is required');
  if (body.selling_price < 0) throw new ValidationError('selling_price must be >= 0');
  if (body.gst_rate < 0 || body.gst_rate > 100) throw new ValidationError('gst_rate must be 0-100');

  const { data, error } = await supabase
    .from('products')
    .insert([{ ...body, business_id: user.businessId }])
    .select()
    .single();

  if (error) throw new ValidationError(error.message);
  return c.json({ success: true, data });
});

productRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', c.req.param('id'))
    .eq('business_id', user.businessId)
    .single();

  if (error || !data) throw new NotFoundError('Product');
  return c.json({ success: true, data });
});

productRoutes.patch('/:id', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const supabase = createSupabaseClient(c.env);
  
  const { data, error } = await supabase
    .from('products')
    .update(body)
    .eq('id', c.req.param('id'))
    .eq('business_id', user.businessId)
    .select()
    .single();

  if (error) throw new ValidationError(error.message);
  return c.json({ success: true, data });
});

productRoutes.post('/import', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const products = body.products;
  
  if (!Array.isArray(products)) {
    throw new ValidationError('Expected an array of products');
  }

  const validProducts: any[] = [];
  const errors: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const obj = products[i];
    if (!obj.name) {
      errors.push(`Row ${i + 1}: Name is required`);
    } else if (obj.selling_price === undefined || parseFloat(obj.selling_price) < 0) {
      errors.push(`Row ${i + 1}: Invalid selling price for product "${obj.name}"`);
    } else {
      validProducts.push({
        business_id: user.businessId,
        name: String(obj.name).trim(),
        sku: obj.sku ? String(obj.sku).trim() : null,
        description: obj.description ? String(obj.description).trim() : null,
        category: obj.category ? String(obj.category).trim() : null,
        unit: obj.unit ? String(obj.unit).trim() : 'pcs',
        selling_price: parseFloat(obj.selling_price) || 0,
        cost_price: obj.cost_price ? parseFloat(obj.cost_price) : null,
        gst_rate: parseFloat(obj.gst_rate) || 0,
        stock_quantity: obj.stock_quantity ? parseInt(obj.stock_quantity, 10) : 0,
        low_stock_threshold: obj.low_stock_threshold ? parseInt(obj.low_stock_threshold, 10) : 10,
        is_active: true
      });
    }
  }

  if (errors.length > 0) {
    return c.json({ success: false, errors, preview: validProducts });
  }

  if (validProducts.length === 0) {
    throw new ValidationError('No valid products to import');
  }

  const supabase = createSupabaseClient(c.env);
  const { data, error } = await supabase.from('products').insert(validProducts);
  
  if (error) {
    throw new ValidationError(error.message);
  }
  
  return c.json({ success: true, message: `Imported ${validProducts.length} products successfully.` });
});

export default productRoutes;
