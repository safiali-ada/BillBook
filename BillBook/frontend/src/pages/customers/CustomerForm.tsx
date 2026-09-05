import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const res = await api.get<{ data: any }>(`/api/customers/${id}`);
      if (res.data) {
        setFormData({
          name: res.data.name || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          address: res.data.address || '',
          gstin: res.data.gstin || '',
        });
      }
    } catch (e) {
      toast.error('Failed to load customer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await api.patch(`/api/customers/${id}`, formData);
        toast.success('Customer updated');
      } else {
        await api.post('/api/customers', formData);
        toast.success('Customer created');
      }
      navigate('/customers');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{id ? 'Edit Customer' : 'Add Customer'}</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Name *" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <Input label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <Input label="GSTIN" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="ghost" onClick={() => navigate('/customers')}>Cancel</Button>
            <Button type="submit" loading={loading}>Save</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}