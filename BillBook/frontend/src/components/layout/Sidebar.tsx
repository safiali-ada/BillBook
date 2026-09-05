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
  LogOut,
  Droplets
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
    <div className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0 bg-slate-900 border-r border-slate-800">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-3 h-16 flex-shrink-0 px-4 bg-slate-950 text-white font-bold text-xl tracking-wide">
          <Droplets className="w-6 h-6 text-primary-400" />
          BillBook
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-3 py-4 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.highlight
                      ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-sm'
                      : isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    item.highlight ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-slate-800 p-4">
          <div className="flex items-center w-full">
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs font-medium text-slate-400 truncate">{profile?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="ml-auto p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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