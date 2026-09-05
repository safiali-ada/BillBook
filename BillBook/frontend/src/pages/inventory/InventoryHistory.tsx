import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { Product, PaginatedResponse } from '../../types';
import { formatDate } from '../../lib/formatters';

interface Transaction {
  id: string;
  transaction_type: 'SALE' | 'PURCHASE' | 'MANUAL_ADJUSTMENT' | 'RETURN' | 'CANCELLATION' | 'CORRECTION';
  quantity_changed: number;
  stock_after: number;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
}

const typeColors: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'default'> = {
  SALE: 'danger',           // Outgoing
  PURCHASE: 'success',      // Incoming
  MANUAL_ADJUSTMENT: 'info',// Misc
  CANCELLATION: 'warning',  // Incoming (refunded stock)
  RETURN: 'success',        // Incoming
  CORRECTION: 'info',
};

export default function InventoryHistory() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch product details
      const productRes = await api.get<{ data: Product }>(`/api/products/${productId}`);
      setProduct(productRes.data);

      // Fetch transaction history
      const historyRes = await api.get<PaginatedResponse<Transaction>>(`/api/inventory/${productId}/history`);
      setTransactions(historyRes.data || []);
    } catch (e) {
      toast.error('Failed to load history');
      navigate('/inventory');
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

  if (!product) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/inventory')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock History</h1>
          <p className="mt-1 text-sm text-gray-500">{product.name} ({product.sku || 'No SKU'})</p>
        </div>
      </div>

      <Card>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Current Stock</h3>
            <p className="text-2xl font-bold text-gray-900">
              {product.stock_quantity} <span className="text-sm font-normal text-gray-500">{product.unit}</span>
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate(`/inventory/adjust/${product.id}`)}>
            Adjust Stock
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold text-right">Change</th>
                <th className="px-6 py-4 font-semibold text-right">Stock After</th>
                <th className="px-6 py-4 font-semibold">Notes / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No transactions found for this product.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(tx.created_at)}
                      <div className="text-xs text-gray-400">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={typeColors[tx.transaction_type] || 'default'}>
                        {tx.transaction_type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      <span className={tx.quantity_changed > 0 ? 'text-green-600' : tx.quantity_changed < 0 ? 'text-red-600' : 'text-gray-900'}>
                        {tx.quantity_changed > 0 ? '+' : ''}{tx.quantity_changed}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {tx.stock_after}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {tx.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}