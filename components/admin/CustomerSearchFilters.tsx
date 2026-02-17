'use client';

import { useState, useEffect } from 'react';
import MultiSelect from '@/components/ui/MultiSelect';
import RangeSlider from '@/components/ui/RangeSlider';
import { Search, RotateCcw } from 'lucide-react';

export interface FilterState {
  search: string;
  segments: string[];
  healthScore: [number, number];
  churnRisk: [number, number];
  orderCount: [number, number];
  totalSpent: [number, number];
  lastOrderDate: { start: string; end: string };
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Props {
  onFilterChange: (filters: FilterState) => void;
  availableTags: Tag[];
}

const initialFilters: FilterState = {
  search: '',
  segments: [],
  healthScore: [0, 100],
  churnRisk: [0, 100],
  orderCount: [0, 1000],
  totalSpent: [0, 1000000],
  lastOrderDate: { start: '', end: '' },
  tags: [],
  sortBy: 'last_order_date',
  sortOrder: 'desc'
};

export default function CustomerSearchFilters({ onFilterChange, availableTags }: Props) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const segmentOptions = [
    { id: 'vip', name: 'VIP Customer', icon: '👑' },
    { id: 'regular', name: 'Regular Customer', icon: '⭐' },
    { id: 'new', name: 'New Customer', icon: '🆕' },
    { id: 'at-risk', name: 'At Risk', icon: '⚠️' },
    { id: 'churned', name: 'Churned', icon: '❌' },
    { id: 'corporate', name: 'Corporate', icon: '🏢' },
    { id: 'weekend-warrior', name: 'Weekend Warrior', icon: '🎉' },
    { id: 'big-spender', name: 'Big Spender', icon: '💰' },
    { id: 'one-time', name: 'One-Time Customer', icon: '🔸' },
    { id: 'emerging', name: 'Emerging', icon: '📈' }
  ];

  const sortOptions = [
    { value: 'last_order_date', label: 'Last Order Date' },
    { value: 'total_spent', label: 'Total Spent' },
    { value: 'total_orders', label: 'Order Count' },
    { value: 'health_score', label: 'Health Score' },
    { value: 'churn_risk', label: 'Churn Risk' },
    { value: 'full_name', label: 'Name' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#552627]">Filters</h2>
        <button
          onClick={resetFilters}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-[#552627] hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Customers
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Name, email, or phone..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
          />
        </div>
      </div>

      {/* Segment Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer Segments
        </label>
        <MultiSelect
          options={segmentOptions}
          selected={filters.segments}
          onChange={(selected) => updateFilter('segments', selected)}
          placeholder="Select segments..."
        />
      </div>

      {/* Health Score Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Health Score
        </label>
        <RangeSlider
          min={0}
          max={100}
          value={filters.healthScore}
          onChange={(value) => updateFilter('healthScore', value)}
        />
      </div>

      {/* Churn Risk Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Churn Risk
        </label>
        <RangeSlider
          min={0}
          max={100}
          value={filters.churnRisk}
          onChange={(value) => updateFilter('churnRisk', value)}
          formatValue={(v) => `${v}%`}
        />
      </div>

      {/* Order Count Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Order Count
        </label>
        <RangeSlider
          min={0}
          max={100}
          step={1}
          value={[
            Math.min(filters.orderCount[0], 100),
            Math.min(filters.orderCount[1], 100)
          ]}
          onChange={(value) => updateFilter('orderCount', value)}
        />
        <div className="text-xs text-gray-500 mt-1">
          {filters.orderCount[1] >= 100 ? '100+' : `Up to ${filters.orderCount[1]}`} orders
        </div>
      </div>

      {/* Total Spent Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Total Spent
        </label>
        <RangeSlider
          min={0}
          max={500000}
          step={5000}
          value={[
            Math.min(filters.totalSpent[0], 500000),
            Math.min(filters.totalSpent[1], 500000)
          ]}
          onChange={(value) => updateFilter('totalSpent', value)}
          formatValue={(v) => `₦${(v / 1000).toFixed(0)}k`}
        />
        <div className="text-xs text-gray-500 mt-1">
          {filters.totalSpent[1] >= 500000 ? '₦500k+' : `Up to ₦${(filters.totalSpent[1] / 1000).toFixed(0)}k`}
        </div>
      </div>

      {/* Last Order Date Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Last Order Date
        </label>
        <div className="space-y-2">
          <input
            type="date"
            value={filters.lastOrderDate.start}
            onChange={(e) => updateFilter('lastOrderDate', {
              ...filters.lastOrderDate,
              start: e.target.value
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
          />
          <input
            type="date"
            value={filters.lastOrderDate.end}
            onChange={(e) => updateFilter('lastOrderDate', {
              ...filters.lastOrderDate,
              end: e.target.value
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
          />
        </div>
      </div>

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Tags
          </label>
          <MultiSelect
            options={availableTags.map(tag => ({ id: tag.id, name: tag.name }))}
            selected={filters.tags}
            onChange={(selected) => updateFilter('tags', selected)}
            placeholder="Select tags..."
          />
        </div>
      )}

      {/* Sort Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent mb-2"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={filters.sortOrder}
          onChange={(e) => updateFilter('sortOrder', e.target.value as 'asc' | 'desc')}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
    </div>
  );
}
