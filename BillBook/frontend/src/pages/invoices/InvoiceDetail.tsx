import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { downloadInvoicePDF } from '../../lib/pdf';
import { useAuth } from '../../hooks/useAuth';
import { FileDown, Printer, Edit, XCircle, ArrowLeft, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Invoice } from '../../types';

const statusVariant: Record<string, 'default' | 'info' | 'success' | 'danger' | 'warning'> = {
  DRAFT: 'default',
  FINALIZED: 'info',
  PAID: 'success',
  CANCELLED: 'danger',
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Invoice }>(`/api/invoices/${id}`);
      setInvoice(res.data);
    } catch {
      toast.error('Failed to load invoice');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!invoice) return;
    setCancelling(true);
    try {
      await api.post(`/api/invoices/${invoice.id}/cancel`);
      toast.success('Invoice cancelled. Stock has been restored.');
      setShowCancelModal(false);
      fetchInvoice();
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel invoice');
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!invoice) return;
    setDeleting(true);
    try {
      await api.delete(`/api/invoices/${invoice.id}`);
      toast.success('Draft invoice deleted.');
      setShowDeleteModal(false);
      navigate('/invoices');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete draft invoice');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    downloadInvoicePDF({
      business_name: profile?.business?.business_name || 'Business',
      business_phone: profile?.business?.phone,
      business_email: profile?.business?.email,
      business_address: profile?.business?.address,
      business_gstin: profile?.business?.gstin,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      status: invoice.status,
      customer_name: invoice.customer_name_snapshot,
      customer_phone: invoice.customer_phone_snapshot,
      customer_address: invoice.customer_address_snapshot,
      customer_gstin: invoice.customer_gstin_snapshot,
      items: invoice.items || [],
      subtotal: invoice.subtotal,
      item_discount_total: invoice.item_discount_total,
      invoice_discount_type: invoice.invoice_discount_type,
      invoice_discount_value: invoice.invoice_discount_value,
      invoice_discount_amount: invoice.invoice_discount_amount,
      taxable_amount: invoice.taxable_amount,
      gst_enabled: invoice.gst_enabled,
      gst_rate: invoice.gst_rate,
      gst_amount: invoice.gst_amount,
      grand_total: invoice.grand_total,
      notes: invoice.notes,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Link to="/invoices" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <p className="text-sm text-gray-500">{formatDate(invoice.invoice_date)}</p>
          </div>
          <Badge variant={statusVariant[invoice.status] || 'default'}>{invoice.status}</Badge>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" icon={<FileDown className="w-4 h-4" />} onClick={handleDownloadPDF}>
            Download PDF
          </Button>
          <Button variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
            Print
          </Button>
          {invoice.status === 'DRAFT' && (
            <>
              <Button variant="secondary" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => navigate(`/invoices/${id}/edit`)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>
                Delete Draft
              </Button>
            </>
          )}
          {invoice.status === 'FINALIZED' && (
            <Button variant="danger" size="sm" icon={<XCircle className="w-4 h-4" />} onClick={() => setShowCancelModal(true)}>
              Cancel Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Invoice content */}
      <Card className="p-6 sm:p-8 print:shadow-none print:border-none">
        {/* Customer & Invoice Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
            <p className="font-semibold text-gray-900">{invoice.customer_name_snapshot || 'Walk-in Customer'}</p>
            {invoice.customer_phone_snapshot && <p className="text-sm text-gray-600">{invoice.customer_phone_snapshot}</p>}
            {invoice.customer_address_snapshot && <p className="text-sm text-gray-600">{invoice.customer_address_snapshot}</p>}
            {invoice.customer_gstin_snapshot && <p className="text-sm text-gray-600">GSTIN: {invoice.customer_gstin_snapshot}</p>}
          </div>
          <div className="sm:text-right">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invoice Details</h3>
            <p className="text-sm text-gray-600">Invoice #: <span className="font-medium text-gray-900">{invoice.invoice_number}</span></p>
            <p className="text-sm text-gray-600">Date: <span className="font-medium text-gray-900">{formatDate(invoice.invoice_date)}</span></p>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">#</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Item</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Qty</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Rate</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Discount</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="py-3">
                    <p className="text-sm font-medium text-gray-900">{item.product_name_snapshot}</p>
                    {item.sku_snapshot && <p className="text-xs text-gray-400">{item.sku_snapshot}</p>}
                    {item.selling_price !== item.original_price && (
                      <p className="text-xs text-amber-500">Original: {formatCurrency(item.original_price)}</p>
                    )}
                  </td>
                  <td className="py-3 text-sm text-gray-900 text-right">{item.quantity} {item.unit_snapshot || 'pcs'}</td>
                  <td className="py-3 text-sm text-gray-900 text-right">{formatCurrency(item.selling_price)}</td>
                  <td className="py-3 text-sm text-right">
                    {item.discount_amount > 0 ? (
                      <span className="text-green-600">
                        -{formatCurrency(item.discount_amount)}
                        {item.discount_type === 'PERCENTAGE' && <span className="text-xs ml-1">({item.discount_value}%)</span>}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>

            {invoice.item_discount_total > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Item Discounts</span>
                <span>-{formatCurrency(invoice.item_discount_total)}</span>
              </div>
            )}

            {invoice.invoice_discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  Invoice Discount
                  {invoice.invoice_discount_type === 'PERCENTAGE' ? ` (${invoice.invoice_discount_value}%)` : ''}
                </span>
                <span>-{formatCurrency(invoice.invoice_discount_amount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-600 pt-1 border-t border-gray-100">
              <span>Taxable Amount</span>
              <span>{formatCurrency(invoice.taxable_amount)}</span>
            </div>

            {invoice.gst_enabled && invoice.gst_amount > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>GST @ {invoice.gst_rate}%</span>
                <span>+{formatCurrency(invoice.gst_amount)}</span>
              </div>
            )}

            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t-2 border-gray-200">
              <span>Grand Total</span>
              <span className="text-primary-600">{formatCurrency(invoice.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </Card>

      {/* Cancel confirmation modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Invoice"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to cancel invoice <strong>{invoice.invoice_number}</strong>?
          </p>
          <p className="text-sm text-gray-600">
            This will:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Change the invoice status to CANCELLED</li>
            <li>Restore all inventory quantities that were deducted</li>
            <li>Create cancellation records in inventory history</li>
          </ul>
          <p className="text-sm text-amber-600 font-medium">This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Keep Invoice</Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelling}>Cancel Invoice</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Draft"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this draft invoice? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              Keep Draft
            </Button>
            <Button variant="danger" onClick={handleDeleteDraft} loading={deleting}>
              Yes, Delete Draft
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}