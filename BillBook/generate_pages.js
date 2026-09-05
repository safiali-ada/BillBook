const fs = require('fs');
const path = require('path');

const rootDir = '/Users/syedsafiali/Documents/GitHub/SIde Projects/BillBook/frontend/src/pages';

const files = {
  'products/ProductList.tsx': `
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import { Product, PaginatedResponse } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { PlusCircle, Search } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch]);

  const fetchProducts = async () => {
    try {
      const res = await api.get<PaginatedResponse<Product>>(\`/api/products?search=\${debouncedSearch}\`);
      setProducts(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your product catalog and pricing.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/products/import')}>Import CSV</Button>
          <Button icon={<PlusCircle className="w-4 h-4" />} onClick={() => navigate('/products/new')}>
            Add Product
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative rounded-md shadow-sm max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Name</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">SKU</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Price</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Stock</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{product.name}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.sku || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatCurrency(product.selling_price)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.stock_quantity}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <Badge variant={product.is_active ? 'success' : 'default'}>{product.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                    <button onClick={() => navigate(\`/products/\${product.id}/edit\`)} className="text-primary-600 hover:text-primary-900">Edit</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
`,
  'products/ProductForm.tsx': `
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
      const res = await api.get<{ data: any }>(\`/api/products/\${id}\`);
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
        await api.put(\`/api/products/\${id}\`, formData);
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
              options={GST_RATES.map(r => ({ label: \`\${r}%\`, value: r }))}
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
`,
  'products/ProductImport.tsx': `
import React from 'react';
export default function ProductImport() { return <div>Not implemented in basic version</div>; }
`,
  'customers/CustomerList.tsx': `
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { Customer, PaginatedResponse } from '../../types';
import { PlusCircle, Search } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearch]);

  const fetchCustomers = async () => {
    try {
      const res = await api.get<PaginatedResponse<Customer>>(\`/api/customers?search=\${debouncedSearch}\`);
      setCustomers(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0">
          <Button icon={<PlusCircle className="w-4 h-4" />} onClick={() => navigate('/customers/new')}>
            Add Customer
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 max-w-sm">
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Phone</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">GSTIN</th>
                <th className="relative py-3.5 pl-3 pr-4"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{customer.phone || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{customer.gstin || '-'}</td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                    <button onClick={() => navigate(\`/customers/\${customer.id}/edit\`)} className="text-primary-600 hover:text-primary-900">Edit</button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
`,
  'customers/CustomerForm.tsx': `
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
      const res = await api.get<{ data: any }>(\`/api/customers/\${id}\`);
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
        await api.put(\`/api/customers/\${id}\`, formData);
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
`,
  'customers/CustomerDetail.tsx': `
import React from 'react';
export default function CustomerDetail() { return <div>Not implemented</div>; }
`,
  'invoices/InvoiceList.tsx': `
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import { Invoice, PaginatedResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { PlusCircle } from 'lucide-react';

export default function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get<PaginatedResponse<Invoice>>('/api/invoices');
      setInvoices(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PAID': return <Badge variant="success">Paid</Badge>;
      case 'FINALIZED': return <Badge variant="info">Finalized</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="default">Draft</Badge>;
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0">
          <Button icon={<PlusCircle className="w-4 h-4" />} onClick={() => navigate('/invoices/new')}>
            New Invoice
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Invoice #</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="relative py-3.5 pl-3 pr-4"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{inv.invoice_number}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(inv.invoice_date)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{inv.customer?.name || inv.customer_name_snapshot || 'Walk-in'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">{formatCurrency(inv.grand_total)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">{getStatusBadge(inv.status)}</td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                    <button onClick={() => navigate(\`/invoices/\${inv.id}\`)} className="text-primary-600 hover:text-primary-900">View</button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
`,
  'invoices/InvoiceCreate.tsx': `
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { calculateFullInvoice } from '../../lib/calculations';
import { formatCurrency } from '../../lib/formatters';
import { Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InvoiceCreate({ editMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    items: [] as any[],
    invoice_discount_type: 'NONE' as 'NONE'|'PERCENTAGE'|'FIXED',
    invoice_discount_value: 0,
    gst_enabled: true,
    gst_rate: 18,
    notes: '',
  });

  const [totals, setTotals] = useState<any>({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Recalculate whenever items or discounts change
    const result = calculateFullInvoice(
      formData.items.map(i => ({
        quantity: i.quantity,
        selling_price: i.selling_price,
        discount_type: i.discount_type,
        discount_value: i.discount_value
      })),
      formData.invoice_discount_type,
      formData.invoice_discount_value,
      formData.gst_enabled,
      formData.gst_rate
    );
    setTotals(result);
  }, [formData]);

  const fetchInitialData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get<any>('/api/customers'),
        api.get<any>('/api/products')
      ]);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
    } catch (e) {
      toast.error('Failed to load initial data');
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, selling_price: 0, discount_type: 'NONE', discount_value: 0 }]
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill price when product selected
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].selling_price = product.selling_price;
      }
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSave = async (finalize = false) => {
    if (formData.items.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    
    try {
      const endpoint = editMode ? \`/api/invoices/\${id}\` : '/api/invoices';
      const method = editMode ? 'put' : 'post';
      
      const payload = {
        ...formData,
        customer_id: formData.customer_id || undefined,
        status: finalize ? 'FINALIZED' : 'DRAFT'
      };
      
      const res = await api[method]<any>(endpoint, payload);
      toast.success(finalize ? 'Invoice finalized' : 'Draft saved');
      navigate(\`/invoices/\${res.data?.id || id}\`);
    } catch (e: any) {
      toast.error(e.message || 'Error saving invoice');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{editMode ? 'Edit Invoice' : 'New Invoice'}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Customer"
                value={formData.customer_id}
                onChange={e => setFormData({...formData, customer_id: e.target.value})}
                options={[{label: 'Walk-in Customer (None)', value: ''}, ...customers.map(c => ({label: c.name, value: c.id}))]}
              />
              <Input
                label="Invoice Date"
                type="date"
                value={formData.invoice_date}
                onChange={e => setFormData({...formData, invoice_date: e.target.value})}
              />
            </div>
          </Card>

          <Card title="Line Items">
            <div className="space-y-4">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Select
                      label="Product"
                      value={item.product_id}
                      onChange={e => updateItem(idx, 'product_id', e.target.value)}
                      options={[{label: 'Select product...', value: ''}, ...products.map(p => ({label: p.name, value: p.id}))]}
                    />
                    <Input
                      label="Price"
                      type="number"
                      value={item.selling_price}
                      onChange={e => updateItem(idx, 'selling_price', parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      label="Qty"
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                    <div className="pt-7 text-right font-medium text-gray-900">
                      {formatCurrency(totals?.items?.[idx]?.total || 0)}
                    </div>
                  </div>
                  <button onClick={() => removeItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded mb-1">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              <Button type="button" variant="ghost" onClick={addItem} icon={<Plus className="w-4 h-4"/>}>
                Add Item
              </Button>
            </div>
          </Card>
          
          <Card title="Settings">
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <input type="checkbox" checked={formData.gst_enabled} onChange={e => setFormData({...formData, gst_enabled: e.target.checked})} className="rounded text-primary-600 focus:ring-primary-500" />
                    <span>Apply GST</span>
                  </label>
                  {formData.gst_enabled && (
                    <Select
                      value={formData.gst_rate.toString()}
                      onChange={e => setFormData({...formData, gst_rate: parseFloat(e.target.value)})}
                      options={[{label: '0%', value: '0'}, {label: '5%', value: '5'}, {label: '12%', value: '12'}, {label: '18%', value: '18'}, {label: '28%', value: '28'}]}
                    />
                  )}
                </div>
             </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(totals?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxable Amount</span>
                <span>{formatCurrency(totals?.taxable_amount || 0)}</span>
              </div>
              {formData.gst_enabled && (
                <div className="flex justify-between">
                  <span>GST ({formData.gst_rate}%)</span>
                  <span>{formatCurrency(totals?.gst_amount || 0)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(totals?.grand_total || 0)}</span>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <Button className="w-full" onClick={() => handleSave(true)}>Finalize Invoice</Button>
              <Button variant="secondary" className="w-full" onClick={() => handleSave(false)}>Save Draft</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
`,
  'invoices/InvoiceDetail.tsx': `
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/formatters';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get<any>(\`/api/invoices/\${id}\`);
        setInvoice(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchInvoice();
  }, [id]);

  if (!invoice) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoice_number}</h1>
        <div className="flex gap-2">
          {invoice.status === 'DRAFT' && <Button variant="secondary" onClick={() => navigate(\`/invoices/\${id}/edit\`)}>Edit</Button>}
          <Button variant="secondary" onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      <Card className="p-8 bg-white print:shadow-none print:ring-0">
        <div className="flex justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold">Billed To:</h2>
            <p className="text-gray-600">{invoice.customer_name_snapshot || 'Walk-in Customer'}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600">Date: {formatDate(invoice.invoice_date)}</p>
            <div className="mt-2">
              <Badge variant={invoice.status === 'FINALIZED' ? 'info' : invoice.status === 'PAID' ? 'success' : 'default'}>
                {invoice.status}
              </Badge>
            </div>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left text-sm font-semibold text-gray-600">
              <th className="pb-3">Item</th>
              <th className="pb-3 text-right">Qty</th>
              <th className="pb-3 text-right">Price</th>
              <th className="pb-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-200 text-sm">
                <td className="py-3">{item.product_name_snapshot}</td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-right">{formatCurrency(item.selling_price)}</td>
                <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.gst_enabled && (
              <div className="flex justify-between">
                <span>GST ({invoice.gst_rate}%)</span>
                <span>{formatCurrency(invoice.gst_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2 mt-2">
              <span>Total</span>
              <span>{formatCurrency(invoice.grand_total)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
`,
  'inventory/InventoryList.tsx': `
import React from 'react';
export default function InventoryList() { return <div className="p-4">Inventory list - coming soon</div>; }
`,
  'inventory/InventoryAdjust.tsx': `
import React from 'react';
export default function InventoryAdjust() { return <div className="p-4">Inventory adjust - coming soon</div>; }
`,
  'inventory/InventoryHistory.tsx': `
import React from 'react';
export default function InventoryHistory() { return <div className="p-4">Inventory history - coming soon</div>; }
`,
  'reports/Reports.tsx': `
import React from 'react';
export default function Reports() { return <div className="p-4">Reports - coming soon</div>; }
`,
  'settings/Settings.tsx': `
import React from 'react';
export default function Settings() { return <div className="p-4">Settings - coming soon</div>; }
`
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
}

console.log('Generated page files successfully');
