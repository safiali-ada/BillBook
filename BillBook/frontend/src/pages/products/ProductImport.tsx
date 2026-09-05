import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, FileText, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ProductImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    if (selected.type !== 'text/csv' && !selected.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }
    
    setFile(selected);
    setValidationErrors([]);
    
    // Parse CSV for preview
    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        // Basic frontend validation
        const errors: string[] = [];
        const validRows: any[] = [];
        
        rows.forEach((row, i) => {
          // Check for required fields mapped from common variations
          const name = row.name || row.Name || row.NAME || row.Product || '';
          const price = row.selling_price || row.Price || row.Rate || row.price || 0;
          
          if (!name) {
            errors.push(`Row ${i + 1}: Missing product name`);
          } else {
            validRows.push({
              name,
              sku: row.sku || row.SKU || '',
              selling_price: parseFloat(price) || 0,
              cost_price: row.cost_price || row.Cost || null,
              category: row.category || row.Category || '',
              unit: row.unit || row.Unit || 'pcs',
              gst_rate: row.gst_rate || row.GST || 0,
              stock_quantity: row.stock_quantity || row.Stock || row.Qty || 0,
            });
          }
        });
        
        setValidationErrors(errors);
        setPreview(validRows);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      toast.error('No valid products to import');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/products/import', { products: preview });
      toast.success('Products imported successfully!');
      navigate('/products');
    } catch (e: any) {
      toast.error(e.message || 'Failed to import products');
      if (e.errors && Array.isArray(e.errors)) {
        setValidationErrors(e.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'name,sku,selling_price,cost_price,category,unit,gst_rate,stock_quantity\nExample Product,EXP-001,150.50,100,Electronics,pcs,18,50\nService Item,,500,,,hr,0,0';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'billbook_products_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/products')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Products</h1>
          <p className="mt-1 text-sm text-gray-500">Upload a CSV file to add multiple products at once.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Instructions</h3>
            <ul className="text-sm text-gray-600 space-y-3 mb-6">
              <li>1. Download the CSV template</li>
              <li>2. Fill in your product details</li>
              <li>3. Upload the completed file</li>
              <li>4. Review the preview and import</li>
            </ul>
            
            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-6">
              <strong>Required column:</strong> `name`
              <br/><br/>
              <strong>Optional columns:</strong> `sku`, `selling_price`, `cost_price`, `category`, `unit`, `gst_rate`, `stock_quantity`
            </div>

            <Button variant="secondary" className="w-full" onClick={downloadTemplate}>
              Download Template
            </Button>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="p-6">
            {!file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <span className="text-sm font-medium text-primary-600 mb-1">Click to upload CSV</span>
                  <span className="text-xs text-gray-500">Max file size: 5MB</span>
                </label>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {preview.length} valid rows found
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview([]); setValidationErrors([]); }}>
                    Change File
                  </Button>
                </div>

                {validationErrors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800">Please fix the following errors:</h4>
                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                          {validationErrors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {validationErrors.length > 5 && (
                            <li>...and {validationErrors.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {preview.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Previewing first 5 rows
                    </h3>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {preview.slice(0, 5).map((row, i) => (
                            <tr key={i}>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.name}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{row.sku || '-'}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">₹{row.selling_price}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{row.stock_quantity || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    loading={loading}
                    disabled={preview.length === 0 || validationErrors.length > 0}
                    onClick={handleImport}
                  >
                    Import {preview.length} Products
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}