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