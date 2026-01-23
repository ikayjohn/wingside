"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  // Integration fields
  zoho_contact_id?: string;
  embedly_customer_id?: string;
  embedly_wallet_id?: string;
  wallet_balance?: number;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<'created_at_desc' | 'created_at_asc'>('created_at_desc');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

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
        console.error('API Error:', res.status, res.statusText, json);
        setError(json?.error || `Failed to load customers (${res.status})`);
        return;
      }

      setCustomers(json.customers || []);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(`Failed to load customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-[#F7C400] hover:text-[#e5b800] font-medium"
                    >
                      View Details
                    </Link>
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
    </div>
  );
}