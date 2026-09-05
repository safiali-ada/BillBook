import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, PackagePlus, PackageMinus } from 'lucide-react';
import { Product } from '../../types';

export default function InventoryAdjust() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [mode, setMode] = useState<'ADD' | 'REMOVE'>('ADD');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('Manual Stock Adjustment');

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await api.get<{ data: Product }>(`/api/products/${productId}`);
      setProduct(res.data);
    } catch (e) {
      toast.error('Failed to load product');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !quantity || quantity <= 0) return;

    setSubmitting(true);
    try {
      // The adjust RPC takes positive for add, negative for remove
      const adjustedQuantity = mode === 'ADD' ? Number(quantity) : -Number(quantity);
      
      await api.post('/api/inventory/adjust', {
        product_id: product.id,
        quantity: adjustedQuantity,
        reason
      });
      
      toast.success('Inventory adjusted successfully!');
      navigate('/inventory');
    } catch (e: any) {
      toast.error(e.message || 'Failed to adjust inventory');
    } finally {
      setSubmitting(false);
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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/inventory')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Adjust Stock</h1>
          <p className="mt-1 text-sm text-gray-500">Manually adjust inventory for {product.name}</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Current Stock</h3>
            <p className="text-2xl font-bold text-gray-900">
              {product.stock_quantity} <span className="text-sm font-normal text-gray-500">{product.unit}</span>
            </p>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-medium text-gray-500">SKU</h3>
            <p className="text-gray-900 font-medium">{product.sku || 'N/A'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode('ADD')}
                className={`flex items-center justify-center gap-2 p-3 border rounded-lg transition-colors ${
                  mode === 'ADD' 
                    ? 'border-green-600 bg-green-50 text-green-700' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <PackagePlus className="w-5 h-5" />
                Add Stock
              </button>
              <button
                type="button"
                onClick={() => setMode('REMOVE')}
                className={`flex items-center justify-center gap-2 p-3 border rounded-lg transition-colors ${
                  mode === 'REMOVE' 
                    ? 'border-red-600 bg-red-50 text-red-700' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <PackageMinus className="w-5 h-5" />
                Remove Stock
              </button>
            </div>
          </div>

          <Input
            label="Quantity to Adjust"
            type="number"
            min="1"
            step="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
            placeholder={`How many to ${mode.toLowerCase()}?`}
          />

          <Input
            label="Reason"
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. New stock arrived, Damaged goods, Stock take correction"
          />

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => navigate('/inventory')} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}