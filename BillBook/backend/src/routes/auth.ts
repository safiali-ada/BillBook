import { Hono } from 'hono';
import { Env, UserContext } from '../types';
import { createSupabaseClient } from '../lib/supabase';
import { ValidationError, NotFoundError } from '../lib/errors';

const authRoutes = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

authRoutes.get('/profile', async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, business:businesses(*)')
    .eq('id', user.userId)
    .single();

  if (error || !profile) {
    throw new NotFoundError('Profile');
  }

  return c.json({ success: true, data: profile });
});

authRoutes.put('/profile', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const supabase = createSupabaseClient(c.env);

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ full_name: body.full_name })
    .eq('id', user.userId)
    .select()
    .single();

  if (error) {
    throw new ValidationError(error.message);
  }

  return c.json({ success: true, data: profile });
});

authRoutes.post('/setup', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const supabase = createSupabaseClient(c.env);

  if (!body.business_name) {
    throw new ValidationError('business_name is required.');
  }

  // Create business
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert([{
      business_name: body.business_name,
      currency: body.currency || 'INR',
      invoice_prefix: body.invoice_prefix || 'INV-',
      invoice_number_start: body.invoice_number_start || 1
    }])
    .select()
    .single();

  if (businessError) {
    throw new ValidationError(businessError.message);
  }

  // Upsert profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.userId,
      email: user.email,
      business_id: business.id,
      role: 'owner'
    })
    .select('*, business:businesses(*)')
    .single();

  if (profileError) {
    throw new ValidationError(profileError.message);
  }

  return c.json({ success: true, data: profile });
});

export default authRoutes;
