import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { PRODUCT_UNITS, GST_RATES } from '../../lib/constants';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    unit: 'pcs',
    selling_price: 0,
    cost_price: 0,
    gst_rate: 0,
    stock_quantity: 0,
    low_stock_threshold: 5,
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get<{ data: any }>(`/api/products/${id}`);
      if (res.data) {
        setFormData({
          name: res.data.name || '',
          sku: res.data.sku || '',
          description: res.data.description || '',
          category: res.data.category || '',
          unit: res.data.unit || 'pcs',
          selling_price: res.data.selling_price || 0,
          cost_price: res.data.cost_price || 0,
          gst_rate: res.data.gst_rate || 0,
          stock_quantity: res.data.stock_quantity || 0,
          low_stock_threshold: res.data.low_stock_threshold || 5,
        });
      }
    } catch (e) {
      toast.error('Failed to load product');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await api.patch(`/api/products/${id}`, formData);
        toast.success('Product updated');
      } else {
        await api.post('/api/products', formData);
        toast.success('Product created');
      }
      navigate('/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{id ? 'Edit Product' : 'Add Product'}</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Name *" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
            <Input label="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Selling Price (₹) *" type="number" step="0.01" required value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: parseFloat(e.target.value)})} />
            <Input label="Cost Price (₹)" type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: parseFloat(e.target.value)})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Unit" 
              value={formData.unit} 
              onChange={e => setFormData({...formData, unit: e.target.value})}
              options={PRODUCT_UNITS.map(u => ({ label: u, value: u }))}
            />
            <Select 
              label="GST Rate (%)" 
              value={formData.gst_rate.toString()} 
              onChange={e => setFormData({...formData, gst_rate: parseFloat(e.target.value)})}
              options={GST_RATES.map(r => ({ label: `${r}%`, value: r }))}
            />
          </div>

          {!id && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Initial Stock" type="number" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: parseFloat(e.target.value)})} />
              <Input label="Low Stock Threshold" type="number" value={formData.low_stock_threshold} onChange={e => setFormData({...formData, low_stock_threshold: parseFloat(e.target.value)})} />
            </div>
          )}

          <Input label="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="ghost" onClick={() => navigate('/products')}>Cancel</Button>
            <Button type="submit" loading={loading}>Save</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}