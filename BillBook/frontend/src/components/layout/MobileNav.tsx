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
              `flex flex-col items-center justify-center w-16 h-full space-y-1 ${
                item.highlight
                  ? 'text-primary-600'
                  : isActive
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            <item.icon className={`h-6 w-6 ${item.highlight ? 'bg-primary-100 p-1 rounded-full' : ''}`} />
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