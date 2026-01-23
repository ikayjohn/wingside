"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: string;
  created_at: string;
  updated_at: string;
  // Order statistics
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  last_visit_date?: string;
  // Address info
  default_address?: string;
  date_of_birth?: string;
  gender?: string;
  // Integration fields
  zoho_contact_id?: string;
  embedly_customer_id?: string;
  embedly_wallet_id?: string;
  wallet_balance?: number;
  loyalty_points?: number;
  tier_status?: string;
  // Referral info
  referred_by?: string;
  referrer_name?: string;
  referral_code?: string;
  total_referrals?: number;
}

interface CustomerDetails extends Customer {
  embedly_wallet_details?: {
    accountNumber: string;
    bankName: string;
    availableBalance: number;
    ledgerBalance: number;
    currencyId: string;
    walletName: string;
  };
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
  referral_details?: {
    referral_code: string;
    total_referrals: number;
    referred_by: string;
    referral_earnings: number;
    successful_referrals: Array<{
      id: string;
      name: string;
      email: string;
      date_referred: string;
    }>;
  };
  support_tickets?: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
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

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

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

  // Points Management State
  const [showPointsManagement, setShowPointsManagement] = useState(false);
  const [pointsDetails, setPointsDetails] = useState<any>(null);
  const [loadingPointsDetails, setLoadingPointsDetails] = useState(false);
  const [pointsAction, setPointsAction] = useState<'award' | 'deduct'>('award');
  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [processingPoints, setProcessingPoints] = useState(false);
  const [pointsMessage, setPointsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCustomerDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCustomer(null);
        setError(json?.error || 'Failed to load customer details');
        return;
      }

      setCustomer(json.customer || null);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  async function fetchOrderHistory(pageNum = 1, status = 'all') {
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
    if (!customer) return;
    setShowOrderHistory(true);
    setOrderHistoryPage(1);
    setOrderHistoryStatus('all');
    setExpandedOrderId(null);
    fetchOrderHistory(1, 'all');
  }

  function closeOrderHistory() {
    setShowOrderHistory(false);
    setOrderHistory([]);
    setExpandedOrderId(null);
  }

  async function syncCustomerToIntegrations() {
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
      await fetchCustomerDetails();

      // Clear success message after 3 seconds
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncMessage({ type: 'error', text: 'Failed to sync customer' });
    } finally {
      setSyncingCustomer(false);
    }
  }

  async function deleteCustomer() {
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

      // Redirect to customers list after a brief delay
      setTimeout(() => {
        router.push('/admin/customers');
      }, 1500);
    } catch (error) {
      console.error('Delete error:', error);
      setSyncMessage({ type: 'error', text: 'Failed to delete customer' });
    } finally {
      setDeletingCustomer(false);
    }
  }

  async function fetchPointsDetails() {
    try {
      setLoadingPointsDetails(true);
      const res = await fetch(`/api/admin/points/${customerId}`);
      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to fetch points details:', data.error);
        return;
      }

      setPointsDetails(data);
    } catch (error) {
      console.error('Error fetching points details:', error);
    } finally {
      setLoadingPointsDetails(false);
    }
  }

  async function handlePointsSubmit(e: React.FormEvent) {
    e.preventDefault();

    const amount = parseInt(pointsAmount);
    if (!amount || amount <= 0) {
      setPointsMessage({ type: 'error', text: 'Please enter a valid points amount' });
      return;
    }

    if (!pointsReason.trim()) {
      setPointsMessage({ type: 'error', text: 'Please provide a reason' });
      return;
    }

    try {
      setProcessingPoints(true);
      setPointsMessage(null);

      const endpoint = pointsAction === 'award'
        ? '/api/admin/points/award'
        : '/api/admin/points/deduct';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: customerId,
          points: amount,
          reason: pointsReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPointsMessage({ type: 'error', text: data.error || `Failed to ${pointsAction} points` });
        return;
      }

      setPointsMessage({
        type: 'success',
        text: `Successfully ${pointsAction === 'award' ? 'awarded' : 'deducted'} ${amount} points!`
      });

      // Reset form
      setPointsAmount('');
      setPointsReason('');

      // Refresh points details and customer info
      await fetchPointsDetails();
      await fetchCustomerDetails();

      // Clear success message after 3 seconds
      setTimeout(() => setPointsMessage(null), 3000);
    } catch (error) {
      console.error('Points operation error:', error);
      setPointsMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setProcessingPoints(false);
    }
  }

  function openPointsManagement() {
    setShowPointsManagement(true);
    fetchPointsDetails();
  }

  function closePointsManagement() {
    setShowPointsManagement(false);
    setPointsAmount('');
    setPointsReason('');
    setPointsMessage(null);
  }

  const exportOrdersToCSV = useCallback(async () => {
    if (!customer) return;

    try {
      // Fetch all orders for export (no pagination limit)
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('pageSize', '1000'); // Get all orders
      if (orderHistoryStatus !== 'all') params.set('status', orderHistoryStatus);

      const res = await fetch(`/api/admin/customers/${customer.id}/orders?${params.toString()}`, {
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
      link.download = `${customer.full_name || customer.email}_orders_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting orders:', error);
      alert('Failed to export orders');
    }
  }, [customer, orderHistoryStatus]);

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

  function formatCustomDate(dateString: string | undefined | null) {
    if (!dateString) return 'Not provided';

    // Handle DD-MM or DD-MM-YYYY format
    const parts = dateString.split('-');
    if (parts.length >= 2) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2] || null;

      // Create a formatted date string
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = parseInt(month) - 1;

      if (monthIndex >= 0 && monthIndex < 12) {
        if (year) {
          return `${day} ${monthNames[monthIndex]} ${year}`;
        } else {
          return `${day} ${monthNames[monthIndex]}`;
        }
      }
    }

    // Fallback: try standard date parsing
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-NG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Return original string if all parsing fails
    return dateString;
  }

  function getTierStatus(points?: number): string {
    if (!points) return 'No Tier';
    if (points >= 20000) return 'Wingzard';
    if (points >= 5001) return 'Wing Leader';
    if (points >= 1) return 'Wing Member';
    return 'No Tier';
  }

  function getTierProgress(points?: number): string {
    if (!points) return '0 pts';
    if (points >= 20000) return 'Max tier!';
    if (points >= 5001) return `${(20000 - points).toLocaleString()} pts to Wingzard`;
    if (points >= 1) return `${(5001 - points).toLocaleString()} pts to Wing Leader`;
    return '1 pt to Wing Member';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading customer details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3">
        {error}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Customer not found</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="text-[#552627] hover:text-[#F7C400] font-medium"
          >
            ← Back to Customers
          </Link>
          <h1 className="text-3xl font-bold text-[#552627]">Customer Details</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={deleteCustomer}
            disabled={deletingCustomer}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deletingCustomer ? 'Deleting...' : 'Delete Customer'}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className={`mb-6 px-4 py-3 rounded ${syncMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {syncMessage.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-[#552627] mb-3">Information</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">First Name:</span>
                  <p className="font-medium">
                    {customer.first_name ||
                      (customer.full_name?.split(' ')[0]) ||
                      'Not provided'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Last Name:</span>
                  <p className="font-medium">
                    {customer.last_name ||
                      (customer.full_name?.split(' ').slice(1).join(' ')) ||
                      'Not provided'}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="font-medium">{customer.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone:</span>
                <p className="font-medium">{customer.phone || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Address{customer.addresses && customer.addresses.length > 1 ? 'es' : ''}:</span>
                {customer.addresses && customer.addresses.length > 0 ? (
                  <div className="space-y-1 mt-1">
                    {customer.addresses.map((address) => (
                      <div key={address.id} className="text-medium">
                        <p>{address.label} {address.is_default && <span className="text-xs text-[#F7C400]">(Default)</span>}</p>
                        <p className="text-sm text-gray-600">
                          {address.street_address}, {address.city}
                          {address.state && `, ${address.state}`}
                          {address.postal_code && ` ${address.postal_code}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-medium">No addresses on file</p>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-500">Date of Birth:</span>
                <p className="font-medium">
                  {formatCustomDate(customer.date_of_birth)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Gender:</span>
                <p className="font-medium capitalize">{customer.gender || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Role:</span>
                <p className="font-medium capitalize flex items-center gap-2">
                  {customer.role}
                  <TierIcon points={customer.loyalty_points} />
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Member Since:</span>
                <p className="font-medium">{formatDate(customer.created_at)}</p>
              </div>
              {customer.last_visit_date && (
                <div>
                  <span className="text-sm text-gray-500">Last Visit:</span>
                  <p className="font-medium">{formatDate(customer.last_visit_date)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-[#552627] mb-3">Order Statistics</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Total Orders:</span>
                <p className="font-medium">{customer.total_orders}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Total Spent:</span>
                <p className="font-medium">{formatCurrency(customer.total_spent)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Average Order Value:</span>
                <p className="font-medium">
                  {customer.total_orders > 0
                    ? formatCurrency(customer.total_spent / customer.total_orders)
                    : formatCurrency(0)
                  }
                </p>
              </div>
              {customer.last_order_date && (
                <div>
                  <span className="text-sm text-gray-500">Last Order:</span>
                  <p className="font-medium">{formatDate(customer.last_order_date)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WingClub Wallet Information */}
        {customer.embedly_wallet_details && (
          <div className="bg-gradient-to-br from-[#F7C400]/10 to-[#FDF5E5] rounded-lg p-6 border-2 border-[#F7C400]/30">
            <h3 className="text-lg font-semibold text-[#552627] mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F7C400]">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              WingClub Wallet Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Embedly Account Number Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F7C400]">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span className="font-medium text-sm text-gray-700">Account Number</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#552627]">{customer.embedly_wallet_details.accountNumber}</p>
                  <p className="text-xs text-gray-500">{customer.embedly_wallet_details.bankName}</p>
                </div>
              </div>

              {/* Wallet Balance Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F7C400]">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  <span className="font-medium text-sm text-gray-700">Wallet Balance</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#552627]">
                    {formatCurrency(customer.embedly_wallet_details.availableBalance)}
                  </p>
                  <p className="text-xs text-gray-500">Available balance</p>
                </div>
              </div>

              {/* Loyalty Points Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F7C400]">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <span className="font-medium text-sm text-gray-700">Loyalty Points</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#552627]">
                    {Math.floor(customer.embedly_wallet_details.availableBalance).toLocaleString()} pts
                  </p>
                  <p className="text-xs text-gray-500">Based on balance</p>
                </div>
              </div>

              {/* WingClub Tier Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TierIcon points={customer.embedly_wallet_details.availableBalance} />
                  <span className="font-medium text-sm text-gray-700">WingClub Tier</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#552627] capitalize flex items-center gap-2">
                    {getTierStatus(customer.embedly_wallet_details.availableBalance)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getTierProgress(customer.embedly_wallet_details.availableBalance)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Points Management Section */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-6 border-2 border-purple-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#552627] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                <path d="M12 18V6"></path>
              </svg>
              Points Management
            </h3>
            {!showPointsManagement && (
              <button
                onClick={openPointsManagement}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Manage Points
              </button>
            )}
          </div>

          {!showPointsManagement ? (
            <div className="bg-white rounded-lg p-4">
              <div className="text-center">
                <p className="text-gray-600 mb-2">Current Balance</p>
                <p className="text-3xl font-bold text-purple-600">
                  {customer.loyalty_points?.toLocaleString() || 0} pts
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Tier: <span className="font-medium">{getTierStatus(customer.loyalty_points)}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="bg-white rounded-lg p-4 flex-1">
                  <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {pointsDetails?.totalPoints?.toLocaleString() || customer.loyalty_points?.toLocaleString() || 0} pts
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tier: {getTierStatus(pointsDetails?.totalPoints || customer.loyalty_points)}
                  </p>
                </div>
                <button
                  onClick={closePointsManagement}
                  className="ml-4 text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {pointsMessage && (
                <div className={`px-4 py-3 rounded ${pointsMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {pointsMessage.text}
                </div>
              )}

              {loadingPointsDetails ? (
                <div className="text-center py-8 text-gray-600">Loading points details...</div>
              ) : (
                <>
                  {/* Points Summary */}
                  {pointsDetails && (
                    <div className="grid grid-cols-3 gap-3 bg-white rounded-lg p-4">
                      <div>
                        <p className="text-xs text-gray-500">Total Earned</p>
                        <p className="text-lg font-bold text-green-600">+{pointsDetails.summary.totalEarned?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Redeemed</p>
                        <p className="text-lg font-bold text-red-600">-{pointsDetails.summary.totalRedeemed?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Expired</p>
                        <p className="text-lg font-bold text-gray-500">-{pointsDetails.summary.totalExpired?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Award/Deduct Form */}
                  <div className="bg-white rounded-lg p-4">
                    <form onSubmit={handlePointsSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Action
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setPointsAction('award')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                              pointsAction === 'award'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Award Points
                          </button>
                          <button
                            type="button"
                            onClick={() => setPointsAction('deduct')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                              pointsAction === 'deduct'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Deduct Points
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Points Amount
                        </label>
                        <input
                          type="number"
                          value={pointsAmount}
                          onChange={(e) => setPointsAmount(e.target.value)}
                          min="1"
                          placeholder="Enter points amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason
                        </label>
                        <textarea
                          value={pointsReason}
                          onChange={(e) => setPointsReason(e.target.value)}
                          placeholder="e.g., Compensation for delivery delay, Contest winner, etc."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={processingPoints}
                        className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                          pointsAction === 'award'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {processingPoints
                          ? `${pointsAction === 'award' ? 'Awarding' : 'Deducting'}...`
                          : `${pointsAction === 'award' ? 'Award' : 'Deduct'} ${pointsAmount || '0'} Points`
                        }
                      </button>
                    </form>
                  </div>

                  {/* Recent Transactions */}
                  {pointsDetails?.recentTransactions && pointsDetails.recentTransactions.length > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Recent Transactions</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pointsDetails.recentTransactions.map((txn: any) => (
                          <div key={txn.id} className="flex justify-between items-start p-3 bg-gray-50 rounded border border-gray-200">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${txn.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {txn.points > 0 ? '+' : ''}{txn.points}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                  {txn.source}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{txn.description}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(txn.created_at).toLocaleString('en-NG', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Integration Status */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#552627]">Integration Status</h3>
            <button
              onClick={syncCustomerToIntegrations}
              disabled={syncingCustomer}
              className="text-sm bg-[#F7C400] text-[#552627] px-4 py-2 rounded-lg font-medium hover:bg-[#e5b800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncingCustomer ? 'Syncing...' : 'Sync Customer'}
            </button>
          </div>

          <div className="flex flex-wrap gap-6">
            {/* Zoho CRM */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${customer.zoho_contact_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-700">Zoho CRM</p>
                <p className="text-xs text-gray-500">
                  {customer.zoho_contact_id ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>

            {/* Embedly */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${customer.embedly_customer_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-700">Embedly</p>
                <p className="text-xs text-gray-500">
                  {customer.embedly_customer_id ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>

            {/* Wallet */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${customer.embedly_wallet_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-700">Wallet</p>
                <p className="text-xs text-gray-500">
                  {customer.embedly_wallet_id ? 'Active' : 'Not Created'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Details */}
        {(customer.referral_details || customer.referral_code || customer.referred_by || customer.total_referrals) && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[#552627] mb-3">Referral Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                {customer.referral_code && (
                  <div>
                    <span className="text-sm text-gray-500">Referral Code:</span>
                    <p className="font-medium">{customer.referral_code}</p>
                  </div>
                )}
                {customer.referred_by && (
                  <div>
                    <span className="text-sm text-gray-500">Referred By:</span>
                    <p className="font-medium">{customer.referrer_name || customer.referred_by}</p>
                  </div>
                )}
                {customer.total_referrals !== undefined && (
                  <div>
                    <span className="text-sm text-gray-500">Total Referrals:</span>
                    <p className="font-medium">{customer.total_referrals}</p>
                  </div>
                )}
              </div>
              {customer.referral_details?.successful_referrals && customer.referral_details.successful_referrals.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">Successful Referrals:</span>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {customer.referral_details.successful_referrals.map((ref) => (
                      <div key={ref.id} className="bg-white rounded p-2 border border-gray-200 text-xs">
                        <p className="font-medium">{ref.name}</p>
                        <p className="text-gray-500">{ref.email}</p>
                        <p className="text-gray-400">Referred: {new Date(ref.date_referred).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {customer.referral_details?.referral_earnings !== undefined && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">Referral Earnings:</span>
                <p className="font-medium text-lg">{formatCurrency(customer.referral_details.referral_earnings)}</p>
              </div>
            )}
          </div>
        )}

        {/* Support Tickets */}
        {customer.support_tickets && customer.support_tickets.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[#552627] mb-3">Support Tickets</h3>
            <div className="space-y-3">
              {customer.support_tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{ticket.subject}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          ticket.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Created: {formatDate(ticket.created_at)}
                      </p>
                      {ticket.updated_at !== ticket.created_at && (
                        <p className="text-xs text-gray-400">
                          Updated: {formatDate(ticket.updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        {customer.recent_orders.length > 0 && !showOrderHistory && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-[#552627]">Recent Orders</h3>
              {customer.total_orders > 5 && (
                <button
                  onClick={openOrderHistory}
                  className="text-sm text-[#F7C400] hover:text-[#e5b800] font-medium"
                >
                  View All Orders ({customer.total_orders})
                </button>
              )}
            </div>
            <div className="space-y-3">
              {customer.recent_orders.map((order) => (
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
            {customer.total_orders > 5 && (
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
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
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
                    fetchOrderHistory(1, e.target.value);
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
                    onClick={() => fetchOrderHistory(orderHistoryPage - 1, orderHistoryStatus)}
                    disabled={orderHistoryPage <= 1 || orderHistoryLoading}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchOrderHistory(orderHistoryPage + 1, orderHistoryStatus)}
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
    </div>
  );
}
