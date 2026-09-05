import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { api } from '../../services/api';
import { Product, PaginatedResponse } from '../../types';
import { Search, ArrowRightLeft, History, Download } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function InventoryList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter]);

  useEffect(() => {
    fetchInventory();
  }, [debouncedSearch, filter, page]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Product>>(`/api/inventory?search=${debouncedSearch}&filter=${filter}&page=${page}&pageSize=50`);
      setProducts(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Fetch all items for the current filter/search to put in the PDF
      const res = await api.get<PaginatedResponse<Product>>(`/api/inventory?search=${debouncedSearch}&filter=${filter}&page=1&pageSize=1000`);
      const allProducts = res.data || [];

      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Inventory Report', 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Filter: ${filter.replace('_', ' ').toUpperCase()}`, 14, 30);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
      doc.text(`Total Items: ${allProducts.length}`, 14, 42);

      const tableData = allProducts.map(p => [
        p.name,
        p.sku || '-',
        p.category || '-',
        `${p.stock_quantity} ${p.unit}`,
        p.stock_quantity <= 0 ? 'Out of Stock' : p.stock_quantity <= (p.low_stock_threshold || 10) ? 'Low Stock' : 'In Stock'
      ]);

      autoTable(doc, {
        startY: 48,
        head: [['Product Name', 'SKU', 'Category', 'Quantity', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [8, 145, 178] } // primary-600 cyan
      });

      doc.save(`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity <= 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (product.stock_quantity <= (product.low_stock_threshold || 10)) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">Track stock levels and view transaction history.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button 
            variant="secondary" 
            icon={<Download className="w-4 h-4" />} 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? 'Generating...' : 'Download PDF Report'}
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="relative rounded-md shadow-sm flex-1 max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Items</option>
              <option value="low_stock">Low Stock Only</option>
              <option value="out_of_stock">Out of Stock Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">SKU</th>
                <th className="px-6 py-4 font-semibold text-right">In Stock</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center mb-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                    Loading inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No products found in inventory.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-gray-500">{product.sku || '-'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 text-right">
                      {product.stock_quantity} {product.unit}
                    </td>
                    <td className="px-6 py-4">
                      {getStockStatus(product)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          icon={<ArrowRightLeft className="w-4 h-4" />}
                          onClick={() => navigate(`/inventory/adjust/${product.id}`)}
                        >
                          Adjust
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<History className="w-4 h-4" />}
                          onClick={() => navigate(`/inventory/history/${product.id}`)}
                        >
                          History
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
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