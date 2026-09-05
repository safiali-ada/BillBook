const fs = require('fs');
const path = require('path');

const rootDir = '/Users/syedsafiali/Documents/GitHub/SIde Projects/BillBook/frontend/src';

const files = {
  'hooks/useAuth.ts': `
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
`,
  'context/AuthContext.tsx': `
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (sessionUser: User | null) => {
    if (!sessionUser) {
      setProfile(null);
      return;
    }
    try {
      const res = await api.get<{ data: Profile }>('/api/auth/profile');
      setProfile(res.data || null);
    } catch (e) {
      console.error('Failed to fetch profile', e);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      fetchProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    await fetchProfile(user);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
`,
  'main.tsx': `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
`,
  'App.tsx': `
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import BusinessSetup from './components/auth/BusinessSetup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';
import ProductImport from './pages/products/ProductImport';
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
import CustomerDetail from './pages/customers/CustomerDetail';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceCreate from './pages/invoices/InvoiceCreate';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import InventoryList from './pages/inventory/InventoryList';
import InventoryAdjust from './pages/inventory/InventoryAdjust';
import InventoryHistory from './pages/inventory/InventoryHistory';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<BusinessSetup />} />
      
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id/edit" element={<ProductForm />} />
        <Route path="/products/import" element={<ProductImport />} />
        
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />
        
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/new" element={<InvoiceCreate />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/invoices/:id/edit" element={<InvoiceCreate editMode />} />
        
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/inventory/adjust" element={<InventoryAdjust />} />
        <Route path="/inventory/:productId/history" element={<InventoryHistory />} />
        
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
`,
  'components/ui/Button.tsx': `
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 border border-transparent shadow-sm',
    secondary: 'text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary-500 border border-gray-300 shadow-sm',
    danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 border border-transparent shadow-sm',
    ghost: 'text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-gray-500 border border-transparent',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={\`\${baseClasses} \${variantClasses[variant]} \${sizeClasses[size]} \${className}\`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
`,
  'components/ui/Input.tsx': `
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <input
          ref={ref}
          className={\`block w-full rounded-lg border \${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          } px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 disabled:bg-gray-100 disabled:cursor-not-allowed \${className}\`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
`,
  'components/ui/Select.tsx': `
import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <select
          ref={ref}
          className={\`block w-full rounded-lg border \${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          } px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white \${className}\`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
`,
  'components/ui/Modal.tsx': `
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">{title}</h3>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2">{children}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
`,
  'components/ui/Card.tsx': `
import React from 'react';

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Card({ title, description, children, footer, className = '' }: CardProps) {
  return (
    <div className={\`bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden \${className}\`}>
      {(title || description) && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          {title && <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>}
          {description && <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">{children}</div>
      {footer && (
        <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}
`,
  'components/ui/Badge.tsx': `
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 ring-gray-500/10',
    success: 'bg-green-50 text-green-700 ring-green-600/20',
    warning: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
    danger: 'bg-red-50 text-red-700 ring-red-600/10',
    info: 'bg-blue-50 text-blue-700 ring-blue-700/10',
  };

  return (
    <span className={\`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset \${variants[variant]} \${className}\`}>
      {children}
    </span>
  );
}
`,
  'components/ui/Spinner.tsx': `
import React from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'w-6 h-6', ...props }: React.ComponentProps<typeof Loader2>) {
  return <Loader2 className={\`animate-spin text-primary-600 \${className}\`} {...props} />;
}
`,
  'components/ui/EmptyState.tsx': `
import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4 text-gray-500">
        {icon}
      </div>
      <h3 className="mt-2 text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
`,
  'components/auth/ProtectedRoute.tsx': `
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../ui/Spinner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile?.business_id && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
`,
  'components/auth/BusinessSetup.tsx': `
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function BusinessSetup() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    invoice_prefix: 'INV-',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/setup', formData);
      await refreshProfile();
      toast.success('Business setup complete!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Setup Your Business
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please provide some details to get started with BillBook.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[600px]">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Business Name *"
              required
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="GSTIN"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              />
              <Input
                label="Invoice Prefix"
                value={formData.invoice_prefix}
                onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
              />
            </div>
            <div className="pt-4">
              <Button type="submit" className="w-full" loading={loading}>
                Complete Setup
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
`,
  'components/layout/AppLayout.tsx': `
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Header from './Header';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="w-full grow p-4 sm:p-6 lg:p-8 mb-16 md:mb-0">
          <Outlet />
        </main>
        <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      </div>
    </div>
  );
}
`,
  'components/layout/Sidebar.tsx': `
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Package, 
  Users, 
  Warehouse, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'New Invoice', to: '/invoices/new', icon: PlusCircle, highlight: true },
  { name: 'Invoices', to: '/invoices', icon: FileText },
  { name: 'Products', to: '/products', icon: Package },
  { name: 'Customers', to: '/customers', icon: Users },
  { name: 'Inventory', to: '/inventory', icon: Warehouse },
  { name: 'Reports', to: '/reports', icon: BarChart3 },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { profile, signOut } = useAuth();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-600 text-white font-bold text-xl">
          BillBook
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  \`group flex items-center px-2 py-2 text-sm font-medium rounded-md \${
                    item.highlight
                      ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                      : isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }\`
                }
              >
                <item.icon
                  className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center w-full">
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-700 truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs font-medium text-gray-500 truncate">{profile?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="ml-auto p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
`,
  'components/layout/MobileNav.tsx': `
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Package, 
  Menu,
  Users,
  Warehouse,
  BarChart3,
  Settings,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signOut } = useAuth();

  const mainItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Invoices', to: '/invoices', icon: FileText },
    { name: 'New Invoice', to: '/invoices/new', icon: PlusCircle, highlight: true },
    { name: 'Products', to: '/products', icon: Package },
  ];

  const moreItems = [
    { name: 'Customers', to: '/customers', icon: Users },
    { name: 'Inventory', to: '/inventory', icon: Warehouse },
    { name: 'Reports', to: '/reports', icon: BarChart3 },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-40 px-2 pb-safe">
        {mainItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              \`flex flex-col items-center justify-center w-16 h-full space-y-1 \${
                item.highlight
                  ? 'text-primary-600'
                  : isActive
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }\`
            }
          >
            <item.icon className={\`h-6 w-6 \${item.highlight ? 'bg-primary-100 p-1 rounded-full' : ''}\`} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}
        <button
          onClick={isOpen ? onClose : () => onClose()} // It's managed by AppLayout state, actually we trigger sheet
          className="flex flex-col items-center justify-center w-16 h-full space-y-1 text-gray-500 hover:text-gray-900"
          type="button"
        >
          <Menu className="h-6 w-6" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>

      {/* Slide-up Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={onClose} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl p-4 shadow-xl transform transition-transform pb-safe">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Menu</h3>
              <button onClick={onClose} className="p-2 text-gray-500"><X className="h-5 w-5"/></button>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {moreItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={onClose}
                  className="flex flex-col items-center space-y-2 text-gray-600"
                >
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium text-center">{item.name}</span>
                </NavLink>
              ))}
            </div>
            <button
              onClick={() => { onClose(); signOut(); }}
              className="w-full flex items-center justify-center space-x-2 py-3 text-red-600 bg-red-50 rounded-lg font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
`,
  'components/layout/Header.tsx': `
import React from 'react';
import { Menu } from 'lucide-react';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="md:hidden sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6 w-full">
          <div className="flex flex-1 text-lg font-semibold leading-6 text-gray-900">
            BillBook
          </div>
          {/* Menu button now opens bottom sheet via MobileNav, so we can hide this or keep it for desktop small screens if any */}
        </div>
      </div>
    </div>
  );
}
`,
  'pages/Login.tsx': `
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Registration successful! Please sign in.');
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-xl sm:px-12 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div>
              <Button type="submit" className="w-full" loading={loading}>
                {isLogin ? 'Sign in' : 'Sign up'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-white px-6 text-gray-900">
                  {isLogin ? 'New to BillBook?' : 'Already have an account?'}
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <Button
                variant="ghost"
                className="w-full text-primary-600 hover:text-primary-500 hover:bg-primary-50"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Create an account' : 'Sign in to existing account'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`,
  'pages/Dashboard.tsx': `
import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../lib/formatters';
import { TrendingUp, FileText, Package, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<any>('/api/reports/summary');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { name: 'Today\\'s Sales', stat: data?.today_sales ? formatCurrency(data.today_sales) : formatCurrency(0), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Invoices Today', stat: data?.invoices_today || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Total Products', stat: data?.total_products || 0, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Low Stock Items', stat: data?.low_stock_count || 0, icon: AlertTriangle, color: data?.low_stock_count > 0 ? 'text-red-600' : 'text-gray-600', bg: data?.low_stock_count > 0 ? 'bg-red-100' : 'bg-gray-100' },
  ];

  if (loading) {
    return <div className="p-8 animate-pulse">Loading...</div>; // Simple skeleton
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.full_name || 'Admin'}</h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening with your business today.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow-sm ring-1 ring-gray-900/5 sm:px-6 sm:pt-6">
            <dt>
              <div className={\`absolute rounded-md p-3 \${item.bg}\`}>
                <item.icon className={\`h-6 w-6 \${item.color}\`} aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Recent Invoices">
          {data?.recent_invoices?.length > 0 ? (
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {data.recent_invoices.map((invoice: any) => (
                  <li key={invoice.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-500">{invoice.customer?.name || 'Walk-in Customer'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(invoice.grand_total)}</p>
                      <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'FINALIZED' ? 'info' : 'default'}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">No recent invoices.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
`
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
}

console.log('Generated base UI files successfully');
