import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import BusinessSetup from './components/auth/BusinessSetup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';
import ProductImport from './pages/products/ProductImport';
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
import CustomerDetail from './pages/customers/CustomerDetail';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceCreate from './pages/invoices/InvoiceCreate';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import InventoryList from './pages/inventory/InventoryList';
import InventoryAdjust from './pages/inventory/InventoryAdjust';
import InventoryHistory from './pages/inventory/InventoryHistory';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<BusinessSetup />} />
      
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id/edit" element={<ProductForm />} />
        <Route path="/products/import" element={<ProductImport />} />
        
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />
        
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/new" element={<InvoiceCreate />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/invoices/:id/edit" element={<InvoiceCreate editMode />} />
        
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/inventory/adjust/:productId" element={<InventoryAdjust />} />
        <Route path="/inventory/:productId/history" element={<InventoryHistory />} />
        
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}