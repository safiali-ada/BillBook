import { Context, Next } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, UserContext } from '../types';
import { UnauthorizedError, handleError } from '../lib/errors';

export async function authMiddleware(c: Context<{ Bindings: Env; Variables: { user: UserContext; accessToken: string } }>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization token.');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired token.');
    }

    // Get user's profile with business_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // User exists in auth but has no profile - they need to complete setup
      c.set('user', {
        userId: user.id,
        email: user.email || '',
        businessId: '',
      });
      c.set('accessToken', token);
      await next();
      return;
    }

    c.set('user', {
      userId: user.id,
      email: user.email || '',
      businessId: profile.business_id || '',
    });
    c.set('accessToken', token);
    await next();
  } catch (error) {
    const { status, body } = handleError(error);
    return c.json(body, status as any);
  }
}
