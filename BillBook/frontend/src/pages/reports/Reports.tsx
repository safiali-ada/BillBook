import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { BarChart3, TrendingUp, Package, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  // For a real app you'd add date pickers to set these
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const today = new Date();
      let fromDate = new Date();
      if (dateRange === '7d') fromDate.setDate(today.getDate() - 7);
      else if (dateRange === '30d') fromDate.setDate(today.getDate() - 30);
      else if (dateRange === '90d') fromDate.setDate(today.getDate() - 90);
      else fromDate.setFullYear(today.getFullYear() - 1); // 1y

      const fromStr = fromDate.toISOString().split('T')[0];
      const toStr = today.toISOString().split('T')[0];

      const [salesRes, productsRes] = await Promise.all([
        api.get<any>(`/api/reports/sales?from_date=${fromStr}&to_date=${toStr}`),
        api.get<any>('/api/reports/top-products')
      ]);

      setSalesData(salesRes.data);
      setTopProducts(productsRes.data || []);
    } catch (e) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Reports</h1>
          <p className="mt-1 text-sm text-gray-500">View your sales performance and top products.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 flex gap-2">
          <select 
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-sm font-medium">Total Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(salesData?.total_sales || 0)}
          </p>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="text-sm font-medium">Total Invoices</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {salesData?.invoice_count || 0}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Calendar className="w-5 h-5" />
            <h3 className="text-sm font-medium">Average Order Value</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(salesData?.avg_value || 0)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Daily Sales Trend
          </h3>
          {salesData?.daily?.length > 0 ? (
            <div className="space-y-4">
              {salesData.daily.map((day: any) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{formatDate(day.date)}</span>
                  <div className="flex items-center gap-4 flex-1 ml-4">
                    <div className="h-2 bg-primary-100 rounded-full flex-1 overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full" 
                        style={{ 
                          width: `${Math.max(5, (day.sales / Math.max(...salesData.daily.map((d:any)=>d.sales))) * 100)}%` 
                        }} 
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 min-w-[100px] text-right">
                      {formatCurrency(day.sales)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm">
              No sales data found for the selected period.
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-400" />
            Top Selling Products
          </h3>
          {topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium text-right">Units Sold</th>
                    <th className="pb-3 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topProducts.map((product, idx) => (
                    <tr key={idx}>
                      <td className="py-3 text-gray-900 font-medium">{product.name}</td>
                      <td className="py-3 text-gray-500 text-right">{product.quantity}</td>
                      <td className="py-3 text-gray-900 text-right font-medium">{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm">
              No product sales data found.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}