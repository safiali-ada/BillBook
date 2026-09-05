import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, UserContext } from './types';
import { authMiddleware } from './middleware/auth';
import { handleError } from './lib/errors';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import customerRoutes from './routes/customers';
import invoiceRoutes from './routes/invoices';
import inventoryRoutes from './routes/inventory';
import reportRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import exportRoutes from './routes/export';
import { createSupabaseClient } from './lib/supabase';

type Variables = {
  user: UserContext;
  accessToken: string;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Auth middleware for all /api routes except health
app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/health') return next();
  return authMiddleware(c, next);
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/products', productRoutes);
app.route('/api/customers', customerRoutes);
app.route('/api/invoices', invoiceRoutes);
app.route('/api/inventory', inventoryRoutes);
app.route('/api/reports', reportRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/export', exportRoutes);

// Global error handler
app.onError((error, c) => {
  const { status, body } = handleError(error);
  return c.json(body, status as any);
});

// 404
app.notFound((c) => c.json({ success: false, error: 'Not found' }, 404));

// Scheduled handler for Supabase keep-alive
const scheduled: ExportedHandler<Env>['scheduled'] = async (event, env, ctx) => {
  const supabase = createSupabaseClient(env);
  // Simple query to keep Supabase project active
  const { error } = await supabase.from('businesses').select('id').limit(1);
  if (error) {
    console.error('Keep-alive ping failed:', error.message);
  } else {
    console.log('Keep-alive ping successful');
  }
};

export default {
  fetch: app.fetch,
  scheduled,
};
