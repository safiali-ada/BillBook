import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { calculateFullInvoice } from '../../lib/calculations';
import { formatCurrency } from '../../lib/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { Trash2, Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, Customer, DiscountType } from '../../types';
import type { InvoiceCalculationResult } from '../../lib/calculations';

interface LineItem {
  product_id: string;
  product_name: string;
  original_price: number;
  selling_price: number;
  quantity: number;
  discount_type: DiscountType;
  discount_value: number;
  stock_quantity: number;
}

const emptyCalcResult: InvoiceCalculationResult = {
  items: [],
  subtotal: 0,
  item_discount_total: 0,
  invoice_discount_amount: 0,
  taxable_amount: 0,
  gst_amount: 0,
  grand_total: 0,
};

export default function InvoiceCreate({ editMode = false }: { editMode?: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Product search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  // Invoice state
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<DiscountType>('NONE');
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState(18);
  const [notes, setNotes] = useState('');

  // Calculated totals
  const [totals, setTotals] = useState<InvoiceCalculationResult>(emptyCalcResult);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Recalculate on any change
  useEffect(() => {
    if (items.length === 0) {
      setTotals(emptyCalcResult);
      return;
    }
    try {
      const result = calculateFullInvoice(
        items.map((i) => ({
          quantity: i.quantity,
          selling_price: i.selling_price,
          discount_type: i.discount_type,
          discount_value: i.discount_value,
        })),
        invoiceDiscountType,
        invoiceDiscountValue,
        gstEnabled,
        gstRate
      );
      setTotals(result);
    } catch {
      // Invalid calculation input, keep previous totals
    }
  }, [items, invoiceDiscountType, invoiceDiscountValue, gstEnabled, gstRate]);

  // Search products
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchProducts(debouncedSearch);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [debouncedSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const custRes = await api.get<{ success: boolean; data: Customer[] }>('/api/customers?pageSize=100');
      setCustomers(custRes.data || []);

      if (editMode && id) {
        const invRes = await api.get<{ success: boolean; data: any }>(`/api/invoices/${id}`);
        const inv = invRes.data;
        if (inv) {
          setSelectedCustomerId(inv.customer_id || '');
          setInvoiceDate(inv.invoice_date);
          setInvoiceDiscountType(inv.invoice_discount_type);
          setInvoiceDiscountValue(inv.invoice_discount_value);
          setGstEnabled(inv.gst_enabled);
          setGstRate(inv.gst_rate);
          setNotes(inv.notes || '');
          if (inv.items) {
            setItems(
              inv.items.map((item: any) => ({
                product_id: item.product_id,
                product_name: item.product_name_snapshot,
                original_price: item.original_price,
                selling_price: item.selling_price,
                quantity: item.quantity,
                discount_type: item.discount_type,
                discount_value: item.discount_value,
                stock_quantity: 0,
              }))
            );
          }
        }
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query: string) => {
    try {
      const res = await api.get<{ success: boolean; data: Product[] }>(
        `/api/products?search=${encodeURIComponent(query)}&active=true&pageSize=10`
      );
      setSearchResults(res.data || []);
      setShowSearchDropdown(true);
    } catch {
      setSearchResults([]);
    }
  };

  const addProduct = useCallback((product: Product) => {
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        original_price: product.selling_price,
        selling_price: product.selling_price,
        quantity: 1,
        discount_type: 'NONE',
        discount_value: 0,
        stock_quantity: product.stock_quantity,
      },
    ]);
    setSearchQuery('');
    setShowSearchDropdown(false);
  }, []);

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (finalize: boolean) => {
    if (items.length === 0) {
      toast.error('Please add at least one item.');
      return;
    }
    for (const item of items) {
      if (item.quantity <= 0) {
        toast.error(`Quantity must be greater than zero for ${item.product_name}.`);
        return;
      }
      if (item.selling_price < 0) {
        toast.error(`Price cannot be negative for ${item.product_name}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        customer_id: selectedCustomerId || undefined,
        invoice_date: invoiceDate,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          selling_price: i.selling_price,
          discount_type: i.discount_type,
          discount_value: i.discount_value,
        })),
        invoice_discount_type: invoiceDiscountType,
        invoice_discount_value: invoiceDiscountValue,
        gst_enabled: gstEnabled,
        gst_rate: gstRate,
        notes,
      };

      let invoiceId: string;

      if (editMode && id) {
        const res = await api.patch<{ success: boolean; data: { id: string } }>(`/api/invoices/${id}`, payload);
        invoiceId = res.data?.id || id;
      } else {
        const res = await api.post<{ success: boolean; data: { id: string } }>('/api/invoices', payload);
        invoiceId = res.data?.id || '';
      }

      if (finalize && invoiceId) {
        await api.post(`/api/invoices/${invoiceId}/finalize`);
        toast.success('Invoice finalized successfully!');
      } else {
        toast.success('Draft saved successfully!');
      }

      navigate(`/invoices/${invoiceId}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save invoice.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{editMode ? 'Edit Invoice' : 'New Invoice'}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Date */}
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                options={[
                  { label: 'Walk-in Customer', value: '' },
                  ...customers.map((c) => ({ label: `${c.name}${c.phone ? ` (${c.phone})` : ''}`, value: c.id })),
                ]}
              />
              <Input label="Invoice Date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
          </Card>

          {/* Product Search & Line Items */}
          <Card>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Line Items</h3>

            {/* Product search */}
            <div ref={searchRef} className="relative mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="w-full text-left px-4 py-3 hover:bg-primary-50 border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            {product.sku ? `SKU: ${product.sku} · ` : ''}Stock: {product.stock_quantity} {product.unit}
                          </p>
                        </div>
                        <span className="font-semibold text-primary-600">{formatCurrency(product.selling_price)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showSearchDropdown && searchResults.length === 0 && debouncedSearch.length >= 2 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                  No products found for "{debouncedSearch}"
                </div>
              )}
            </div>

            {/* Line items */}
            <div className="space-y-3">
              {items.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Search and add products above to create invoice items.</p>
                </div>
              )}

              {items.map((item, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  {/* Product header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-xs text-gray-500">
                        Default price: {formatCurrency(item.original_price)} · Stock: {item.stock_quantity}
                      </p>
                    </div>
                    <button onClick={() => removeItem(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Price, Qty, Discount row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="label">Selling Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.selling_price}
                        onChange={(e) => updateItem(idx, 'selling_price', parseFloat(e.target.value) || 0)}
                        className={`input-field ${item.selling_price !== item.original_price ? 'border-amber-400 bg-amber-50' : ''}`}
                      />
                      {item.selling_price !== item.original_price && (
                        <p className="text-xs text-amber-600 mt-0.5">Modified from {formatCurrency(item.original_price)}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="label">Discount</label>
                      <div className="flex gap-1">
                        <select
                          value={item.discount_type}
                          onChange={(e) => {
                            updateItem(idx, 'discount_type', e.target.value);
                            if (e.target.value === 'NONE') updateItem(idx, 'discount_value', 0);
                          }}
                          className="input-field w-20 text-xs px-1"
                        >
                          <option value="NONE">None</option>
                          <option value="PERCENTAGE">%</option>
                          <option value="FIXED">₹</option>
                        </select>
                        {item.discount_type !== 'NONE' && (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.discount_value}
                            onChange={(e) => updateItem(idx, 'discount_value', parseFloat(e.target.value) || 0)}
                            className="input-field flex-1"
                            placeholder={item.discount_type === 'PERCENTAGE' ? '%' : '₹'}
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="label">Line Total</label>
                      <div className="text-right font-semibold text-gray-900 py-2">
                        {formatCurrency(totals?.items?.[idx]?.total || 0)}
                      </div>
                      {(totals?.items?.[idx]?.discount_amount || 0) > 0 && (
                        <p className="text-xs text-green-600 text-right">-{formatCurrency(totals.items[idx].discount_amount)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Invoice Discount & GST */}
          <Card>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Discount & Tax</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Invoice-level discount */}
              <div>
                <label className="label">Invoice Discount</label>
                <div className="flex gap-2">
                  <select
                    value={invoiceDiscountType}
                    onChange={(e) => {
                      setInvoiceDiscountType(e.target.value as DiscountType);
                      if (e.target.value === 'NONE') setInvoiceDiscountValue(0);
                    }}
                    className="input-field w-28"
                  >
                    <option value="NONE">None</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed (₹)</option>
                  </select>
                  {invoiceDiscountType !== 'NONE' && (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={invoiceDiscountValue}
                      onChange={(e) => setInvoiceDiscountValue(parseFloat(e.target.value) || 0)}
                      className="input-field flex-1"
                      placeholder={invoiceDiscountType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 500'}
                    />
                  )}
                </div>
              </div>

              {/* GST */}
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={gstEnabled}
                    onChange={(e) => setGstEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Apply GST</span>
                </label>
                {gstEnabled && (
                  <Select
                    value={gstRate.toString()}
                    onChange={(e) => setGstRate(parseFloat(e.target.value))}
                    options={[
                      { label: '5%', value: '5' },
                      { label: '12%', value: '12' },
                      { label: '18%', value: '18' },
                      { label: '28%', value: '28' },
                    ]}
                  />
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="label">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Optional notes for this invoice..."
              />
            </div>
          </Card>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>

                {totals.item_discount_total > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Item Discounts</span>
                    <span>-{formatCurrency(totals.item_discount_total)}</span>
                  </div>
                )}

                {totals.invoice_discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Invoice Discount
                      {invoiceDiscountType === 'PERCENTAGE' ? ` (${invoiceDiscountValue}%)` : ''}
                    </span>
                    <span>-{formatCurrency(totals.invoice_discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-100">
                  <span>Taxable Amount</span>
                  <span>{formatCurrency(totals.taxable_amount)}</span>
                </div>

                {gstEnabled && (
                  <div className="flex justify-between text-gray-600">
                    <span>GST @ {gstRate}%</span>
                    <span>+{formatCurrency(totals.gst_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t-2 border-gray-200">
                  <span className="text-lg font-bold text-gray-900">Grand Total</span>
                  <span className="text-lg font-bold text-primary-600">{formatCurrency(totals.grand_total)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button className="w-full" size="lg" onClick={() => handleSave(true)} loading={saving} disabled={items.length === 0}>
                  Finalize Invoice
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => handleSave(false)} loading={saving} disabled={items.length === 0}>
                  Save as Draft
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}