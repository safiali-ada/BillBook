import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { api } from '../../services/api';
import { Invoice, PaginatedResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { PlusCircle } from 'lucide-react';

export default function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchInvoices();
  }, [page]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get<PaginatedResponse<Invoice>>(`/api/invoices?page=${page}&pageSize=50`);
      setInvoices(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.total || 0);
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
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
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
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Invoice #</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{invoice.invoice_number}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(invoice.invoice_date)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{invoice.customer?.name || 'Walk-in'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{formatCurrency(invoice.grand_total)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                    <button onClick={() => navigate(`/invoices/${invoice.id}`)} className="text-primary-600 hover:text-primary-900">View</button>
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
        
        <Pagination 
          page={page} 
          totalPages={totalPages} 
          totalItems={totalItems} 
          onPageChange={setPage} 
        />
      </Card>
    </div>
  );
}