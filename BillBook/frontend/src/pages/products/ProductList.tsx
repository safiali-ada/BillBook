import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { api } from '../../services/api';
import { Product, PaginatedResponse } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { PlusCircle, Search } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, page]);

  const fetchProducts = async () => {
    try {
      const res = await api.get<PaginatedResponse<Product>>(`/api/products?search=${debouncedSearch}&page=${page}&pageSize=50`);
      setProducts(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.total || 0);
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
                    <button onClick={() => navigate(`/products/${product.id}/edit`)} className="text-primary-600 hover:text-primary-900">Edit</button>
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