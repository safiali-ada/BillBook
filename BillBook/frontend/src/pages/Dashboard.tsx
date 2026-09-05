import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    { name: 'Today\'s Sales', stat: data?.today_sales ? formatCurrency(data.today_sales) : formatCurrency(0), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100', link: '/reports' },
    { name: 'Invoices Today', stat: data?.invoices_today || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', link: '/invoices' },
    { name: 'Total Products', stat: data?.total_products || 0, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100', link: '/products' },
    { name: 'Low Stock Items', stat: data?.low_stock_count || 0, icon: AlertTriangle, color: data?.low_stock_count > 0 ? 'text-red-600' : 'text-gray-600', bg: data?.low_stock_count > 0 ? 'bg-red-100' : 'bg-gray-100', link: '/inventory' },
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
          <Link 
            key={item.name} 
            to={item.link}
            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow-sm ring-1 ring-gray-900/5 sm:px-6 sm:pt-6 hover:shadow-md transition-shadow cursor-pointer block"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
            </dd>
          </Link>
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