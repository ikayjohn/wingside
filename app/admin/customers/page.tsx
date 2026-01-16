"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Tier Icon Component
function TierIcon({ points }: { points?: number }) {
  if (!points) return null;

  let tierIcon = '/wingmember.svg';
  let alt = 'Wing Member';

  if (points >= 20000) {
    tierIcon = '/wingzard.svg';
    alt = 'Wingzard';
  } else if (points >= 5001) {
    tierIcon = '/wingleader.svg';
    alt = 'Wing Leader';
  }

  return (
    <Image
      src={tierIcon}
      alt={alt}
      width={24}
      height={24}
      className="inline-block"
      title={alt}
    />
  );
}

interface Customer {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: string;
  created_at: string;
  updated_at: string;
  // Order statistics
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  // Address info
  default_address?: string;
  // Integration fields
  zoho_contact_id?: string;
  embedly_customer_id?: string;
  embedly_wallet_id?: string;
  wallet_balance?: number;
}

interface CustomerDetails extends Customer {
  addresses: Array<{
    id: string;
    label: string;
    street_address: string;
    city: string;
    state?: string;
    postal_code?: string;
    is_default: boolean;
  }>;
  recent_orders: Array<{
    id: string;
    order_number: string;
    status: string;
    total: number;
    created_at: string;
  }>;
}

interface FullOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  delivery_address_text?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: string;
    product_name: string;
    product_size?: string;
    flavors?: string[];
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string>('');
  const [detailsError, setDetailsError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<'created_at_desc' | 'created_at_asc'>('created_at_desc');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Full order history state
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState<FullOrder[]>([]);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const [orderHistoryError, setOrderHistoryError] = useState('');
  const [orderHistoryPage, setOrderHistoryPage] = useState(1);
  const [orderHistoryTotalPages, setOrderHistoryTotalPages] = useState(1);
  const [orderHistoryStatus, setOrderHistoryStatus] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [syncingCustomer, setSyncingCustomer] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.set('role', filter);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('sort', sort);

      const res = await fetch(`/api/admin/customers?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCustomers([]);
        setTotalPages(1);
        setError(json?.error || 'Failed to load customers');
        return;
      }

      setCustomers(json.customers || []);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch, page, pageSize, sort, setLoading, setError, setCustomers, setTotalPages]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm, setDebouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch, pageSize, sort, setPage]);

  useEffect(() => {
    fetchCustomers();
  }, [filter, debouncedSearch, page, pageSize, sort, fetchCustomers]);

  async function fetchOrderHistory(customerId: string, pageNum = 1, status = 'all') {
    try {
      setOrderHistoryLoading(true);
      setOrderHistoryError('');

      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('pageSize', '10');
      if (status !== 'all') params.set('status', status);

      const res = await fetch(`/api/admin/customers/${customerId}/orders?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrderHistory([]);
        setOrderHistoryTotalPages(1);
        setOrderHistoryError(json?.error || 'Failed to load order history');
        return;
      }

      setOrderHistory(json.orders || []);
      setOrderHistoryTotalPages(json.pagination?.totalPages || 1);
      setOrderHistoryPage(pageNum);
    } catch (error) {
      console.error('Error fetching order history:', error);
      setOrderHistoryError('Failed to load order history');
    } finally {
      setOrderHistoryLoading(false);
    }
  }

  function openOrderHistory() {
    if (!selectedCustomer) return;
    setShowOrderHistory(true);
    setOrderHistoryPage(1);
    setOrderHistoryStatus('all');
    setExpandedOrderId(null);
    fetchOrderHistory(selectedCustomer.id, 1, 'all');
  }

  function closeOrderHistory() {
    setShowOrderHistory(false);
    setOrderHistory([]);
    setExpandedOrderId(null);
  }

  async function syncCustomerToIntegrations(customerId: string) {
    try {
      setSyncingCustomer(true);
      setSyncMessage(null);

      const res = await fetch(`/api/admin/customers/${customerId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setSyncMessage({ type: 'error', text: data.error || 'Failed to sync customer' });
        return;
      }

      setSyncMessage({ type: 'success', text: 'Customer synced successfully!' });

      // Refresh customer details to show updated integration IDs
      await fetchCustomerDetails(customerId);

      // Clear success message after 3 seconds
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncMessage({ type: 'error', text: 'Failed to sync customer' });
    } finally {
      setSyncingCustomer(false);
    }
  }

  async function deleteCustomer(customerId: string) {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingCustomer(true);
      setSyncMessage(null);

      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setSyncMessage({ type: 'error', text: data.error || 'Failed to delete customer' });
        return;
      }

      setSyncMessage({ type: 'success', text: 'Customer deleted successfully!' });

      // Close details panel and refresh customer list
      setSelectedCustomer(null);
      await fetchCustomers();

      // Clear success message after 3 seconds
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (error) {
      console.error('Delete error:', error);
      setSyncMessage({ type: 'error', text: 'Failed to delete customer' });
    } finally {
      setDeletingCustomer(false);
    }
  }

  const exportOrdersToCSV = useCallback(async () => {
    if (!selectedCustomer) return;

    try {
      // Fetch all orders for export (no pagination limit)
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('pageSize', '1000'); // Get all orders
      if (orderHistoryStatus !== 'all') params.set('status', orderHistoryStatus);

      const res = await fetch(`/api/admin/customers/${selectedCustomer.id}/orders?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.orders) {
        alert('Failed to export orders');
        return;
      }

      const orders: FullOrder[] = json.orders;

      // Build CSV content
      const headers = [
        'Order Number',
        'Date',
        'Status',
        'Payment Status',
        'Payment Method',
        'Subtotal',
        'Delivery Fee',
        'Tax',
        'Total',
        'Delivery Address',
        'Notes',
        'Items',
      ];

      const rows = orders.map((order) => {
        const itemsSummary = order.items
          .map((item) => `${item.quantity}x ${item.product_name}${item.product_size ? ` (${item.product_size})` : ''}`)
          .join('; ');

        return [
          order.order_number,
          new Date(order.created_at).toISOString(),
          order.status,
          order.payment_status,
          order.payment_method || '',
          order.subtotal.toFixed(2),
          order.delivery_fee.toFixed(2),
          order.tax.toFixed(2),
          order.total.toFixed(2),
          (order.delivery_address_text || '').replace(/[\n\r]+/g, ' '),
          (order.notes || '').replace(/[\n\r]+/g, ' '),
          itemsSummary,
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedCustomer.full_name || selectedCustomer.email}_orders_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting orders:', error);
      alert('Failed to export orders');
    }
  }, [selectedCustomer, orderHistoryStatus]);

  async function fetchCustomerDetails(customerId: string) {
    try {
      setLoadingDetails(true);
      setDetailsError('');
      setShowOrderHistory(false);

      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSelectedCustomer(null);
        setDetailsError(json?.error || 'Failed to load customer details');
        return;
      }

      setSelectedCustomer(json.customer || null);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      setDetailsError('Failed to load customer details');
    } finally {
      setLoadingDetails(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  }

  const filteredCustomers = useMemo(() => customers, [customers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading customers...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#552627]">Customers</h1>
        <div className="text-sm text-gray-600">
          {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
            >
              <option value="all">All Customers</option>
              <option value="customer">Customers</option>
              <option value="staff">Staff</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
            >
              <option value="created_at_desc">Newest</option>
              <option value="created_at_asc">Oldest</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {customer.full_name || 'No name'}
                        <TierIcon points={customer.wallet_balance} />
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.role}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone || 'No phone'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.total_orders}</div>
                    {customer.last_order_date && (
                      <div className="text-xs text-gray-500">
                        Last: {formatDate(customer.last_order_date)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(customer.total_spent)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(customer.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => fetchCustomerDetails(customer.id)}
                      className="text-[#F7C400] hover:text-[#e5b800] font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No customers found</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-[#552627]">Customer Details</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => deleteCustomer(selectedCustomer.id)}
                    disabled={deletingCustomer}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {deletingCustomer ? 'Deleting...' : 'Delete Customer'}
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {loadingDetails ? (
                <div className="text-center py-8">
                  <div className="text-gray-600">Loading details...</div>
                </div>
              ) : detailsError ? (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
                  {detailsError}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-[#552627] mb-3">Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Name:</span>
                          <p className="font-medium">{selectedCustomer.full_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Email:</span>
                          <p className="font-medium">{selectedCustomer.email}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Phone:</span>
                          <p className="font-medium">{selectedCustomer.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Role:</span>
                          <p className="font-medium capitalize flex items-center gap-2">
                            {selectedCustomer.role}
                            <TierIcon points={selectedCustomer.wallet_balance} />
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Member Since:</span>
                          <p className="font-medium">{formatDate(selectedCustomer.created_at)}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[#552627] mb-3">Order Statistics</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Total Orders:</span>
                          <p className="font-medium">{selectedCustomer.total_orders}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Total Spent:</span>
                          <p className="font-medium">{formatCurrency(selectedCustomer.total_spent)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Average Order Value:</span>
                          <p className="font-medium">
                            {selectedCustomer.total_orders > 0 
                              ? formatCurrency(selectedCustomer.total_spent / selectedCustomer.total_orders)
                              : formatCurrency(0)
                            }
                          </p>
                        </div>
                        {selectedCustomer.last_order_date && (
                          <div>
                            <span className="text-sm text-gray-500">Last Order:</span>
                            <p className="font-medium">{formatDate(selectedCustomer.last_order_date)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Integration Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-[#552627]">Integration Status</h3>
                        <button
                          onClick={() => syncCustomerToIntegrations(selectedCustomer.id)}
                          disabled={syncingCustomer}
                          className="text-sm bg-[#F7C400] text-[#552627] px-4 py-2 rounded-lg font-medium hover:bg-[#e5b800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {syncingCustomer ? 'Syncing...' : 'Sync Customer'}
                        </button>
                      </div>
                      {syncMessage && (
                        <div className={`text-sm px-3 py-2 rounded ${syncMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {syncMessage.text}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Zoho CRM */}
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${selectedCustomer.zoho_contact_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="font-medium text-sm">Zoho CRM</span>
                        </div>
                        {selectedCustomer.zoho_contact_id ? (
                          <p className="text-xs text-gray-500 truncate" title={selectedCustomer.zoho_contact_id}>
                            ID: {selectedCustomer.zoho_contact_id.slice(0, 12)}...
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">Not synced</p>
                        )}
                      </div>

                      {/* Embedly Customer */}
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${selectedCustomer.embedly_customer_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="font-medium text-sm">Embedly</span>
                        </div>
                        {selectedCustomer.embedly_customer_id ? (
                          <p className="text-xs text-gray-500 truncate" title={selectedCustomer.embedly_customer_id}>
                            ID: {selectedCustomer.embedly_customer_id.slice(0, 12)}...
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">Not synced</p>
                        )}
                      </div>

                      {/* Wallet Balance */}
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${selectedCustomer.embedly_wallet_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="font-medium text-sm">Loyalty Points</span>
                        </div>
                        {selectedCustomer.embedly_wallet_id ? (
                          <p className="text-sm font-semibold text-[#552627]">
                            {(selectedCustomer.wallet_balance || 0).toLocaleString()} pts
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">No wallet</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Addresses */}
                  {selectedCustomer.addresses.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-[#552627] mb-3">Addresses</h3>
                      <div className="space-y-3">
                        {selectedCustomer.addresses.map((address) => (
                          <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {address.label} {address.is_default && '(Default)'}
                                </p>
                                <p className="text-gray-600 mt-1">
                                  {address.street_address}, {address.city}
                                  {address.state && `, ${address.state}`}
                                  {address.postal_code && ` ${address.postal_code}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Orders */}
                  {selectedCustomer.recent_orders.length > 0 && !showOrderHistory && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-[#552627]">Recent Orders</h3>
                        {selectedCustomer.total_orders > 5 && (
                          <button
                            onClick={openOrderHistory}
                            className="text-sm text-[#F7C400] hover:text-[#e5b800] font-medium"
                          >
                            View All Orders ({selectedCustomer.total_orders})
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {selectedCustomer.recent_orders.map((order) => (
                          <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900">{order.order_number}</p>
                                <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(order.total)}</p>
                                <p className="text-sm text-gray-500 capitalize">{order.status.replace('_', ' ')}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedCustomer.total_orders > 5 && (
                        <button
                          onClick={openOrderHistory}
                          className="mt-4 w-full py-2 text-center text-sm text-[#552627] border border-[#F7C400] rounded-lg hover:bg-[#FDF5E5] transition-colors"
                        >
                          View Full Order History
                        </button>
                      )}
                    </div>
                  )}

                  {/* Full Order History */}
                  {showOrderHistory && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={closeOrderHistory}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ← Back
                          </button>
                          <h3 className="text-lg font-semibold text-[#552627]">Order History</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={exportOrdersToCSV}
                            className="px-3 py-1.5 text-sm bg-[#552627] text-white rounded-lg hover:bg-[#6d3132] transition-colors"
                          >
                            Export CSV
                          </button>
                          <select
                            value={orderHistoryStatus}
                            onChange={(e) => {
                              setOrderHistoryStatus(e.target.value);
                              fetchOrderHistory(selectedCustomer.id, 1, e.target.value);
                            }}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                          >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {orderHistoryLoading ? (
                        <div className="text-center py-8 text-gray-600">Loading orders...</div>
                      ) : orderHistoryError ? (
                        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
                          {orderHistoryError}
                        </div>
                      ) : orderHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No orders found</div>
                      ) : (
                        <div className="space-y-3">
                          {orderHistory.map((order) => (
                            <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                              <div
                                className="p-4 cursor-pointer hover:bg-gray-50"
                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium text-gray-900">{order.order_number}</p>
                                    <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatCurrency(order.total)}</p>
                                    <p className="text-sm text-gray-500 capitalize">{order.status.replace('_', ' ')}</p>
                                  </div>
                                </div>
                              </div>

                              {expandedOrderId === order.id && (
                                <div className="border-t border-gray-200 p-4 bg-gray-50">
                                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <div>
                                      <span className="text-gray-500">Payment:</span>
                                      <span className="ml-2 capitalize">{order.payment_status} ({order.payment_method || 'N/A'})</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Subtotal:</span>
                                      <span className="ml-2">{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Delivery Fee:</span>
                                      <span className="ml-2">{formatCurrency(order.delivery_fee)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Tax:</span>
                                      <span className="ml-2">{formatCurrency(order.tax)}</span>
                                    </div>
                                  </div>

                                  {order.delivery_address_text && (
                                    <div className="text-sm mb-4">
                                      <span className="text-gray-500">Delivery Address:</span>
                                      <p className="mt-1">{order.delivery_address_text}</p>
                                    </div>
                                  )}

                                  {order.notes && (
                                    <div className="text-sm mb-4">
                                      <span className="text-gray-500">Notes:</span>
                                      <p className="mt-1">{order.notes}</p>
                                    </div>
                                  )}

                                  <div className="text-sm">
                                    <span className="text-gray-500 font-medium">Items:</span>
                                    <div className="mt-2 space-y-2">
                                      {order.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start bg-white p-2 rounded border border-gray-100">
                                          <div>
                                            <p className="font-medium">{item.product_name}</p>
                                            {item.product_size && (
                                              <p className="text-gray-500 text-xs">Size: {item.product_size}</p>
                                            )}
                                            {item.flavors && item.flavors.length > 0 && (
                                              <p className="text-gray-500 text-xs">Flavors: {item.flavors.join(', ')}</p>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <p>{item.quantity} × {formatCurrency(item.unit_price)}</p>
                                            <p className="font-medium">{formatCurrency(item.total_price)}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="mt-4 pt-3 border-t border-gray-200">
                                    <Link
                                      href={`/admin/orders?order=${order.order_number}`}
                                      className="text-sm text-[#F7C400] hover:text-[#e5b800] font-medium"
                                    >
                                      View in Orders Page →
                                    </Link>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {orderHistoryTotalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-gray-600">
                            Page {orderHistoryPage} of {orderHistoryTotalPages}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => fetchOrderHistory(selectedCustomer.id, orderHistoryPage - 1, orderHistoryStatus)}
                              disabled={orderHistoryPage <= 1 || orderHistoryLoading}
                              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-50"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => fetchOrderHistory(selectedCustomer.id, orderHistoryPage + 1, orderHistoryStatus)}
                              disabled={orderHistoryPage >= orderHistoryTotalPages || orderHistoryLoading}
                              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-50"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}