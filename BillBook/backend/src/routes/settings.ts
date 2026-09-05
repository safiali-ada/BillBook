import { Hono } from 'hono';
import { Env, UserContext } from '../types';
import { createSupabaseClient } from '../lib/supabase';
import { ValidationError } from '../lib/errors';

const settingsRoutes = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

settingsRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user.businessId) throw new ValidationError('Please complete business setup first.');
  await next();
});

settingsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);
  
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.businessId)
    .single();

  if (error) throw new ValidationError(error.message);
  return c.json({ success: true, data });
});

settingsRoutes.put('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const supabase = createSupabaseClient(c.env);

  if (!body.business_name) throw new ValidationError('business_name is required');

  const { data, error } = await supabase
    .from('businesses')
    .update(body)
    .eq('id', user.businessId)
    .select()
    .single();

  if (error) throw new ValidationError(error.message);
  return c.json({ success: true, data });
});

export default settingsRoutes;
