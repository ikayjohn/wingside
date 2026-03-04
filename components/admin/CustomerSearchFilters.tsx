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
  resetSegmentsTrigger?: number;
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

export default function CustomerSearchFilters({ onFilterChange, availableTags, resetSegmentsTrigger }: Props) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  useEffect(() => {
    if (resetSegmentsTrigger) {
      setFilters(prev => ({ ...prev, segments: [] }));
    }
  }, [resetSegmentsTrigger]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const segmentOptions = [
    { id: 'vip', name: 'VIP Customer' },
    { id: 'regular', name: 'Regular Customer' },
    { id: 'new', name: 'New Customer' },
    { id: 'at-risk', name: 'At Risk' },
    { id: 'churned', name: 'Churned' },
    { id: 'corporate', name: 'Corporate' },
    { id: 'weekend-warrior', name: 'Weekend Warrior' },
    { id: 'big-spender', name: 'Big Spender' },
    { id: 'one-time', name: 'One-Time Customer' },
    { id: 'emerging', name: 'Emerging' },
    { id: 'loyal', name: 'Loyal Customer' },
    { id: 'frequent', name: 'Frequent Customer' },
    { id: 'high-ltv', name: 'High Lifetime Value' },
    { id: 'morning-orderer', name: 'Morning Orderer' },
    { id: 'afternoon-orderer', name: 'Afternoon Orderer' },
    { id: 'evening-orderer', name: 'Evening Orderer' },
    { id: 'weekday-orderer', name: 'Weekday Orderer' }
  ];

  const sortOptions = [
    { value: 'last_order_date', label: 'Last Order Date' },
    { value: 'total_spent', label: 'Total Spent' },
    { value: 'total_orders', label: 'Order Count' },
    { value: 'health_score', label: 'Health Score' },
    { value: 'churn_risk', label: 'Churn Risk' },
    { value: 'full_name', label: 'Name' }
  ];

  const labelClass = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5";
  const inputClass = "w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#F7C400] focus:border-[#F7C400]";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4 sticky top-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#552627]">Filters</h2>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 hover:text-[#552627] hover:bg-gray-50 rounded transition-colors"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {/* Search */}
      <div>
        <label className={labelClass}>Search</label>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Name, email, phone..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className={`${inputClass} pl-7`}
          />
        </div>
      </div>

      {/* Segments */}
      <div>
        <label className={labelClass}>Segments</label>
        <MultiSelect
          options={segmentOptions}
          selected={filters.segments}
          onChange={(selected) => updateFilter('segments', selected)}
          placeholder="Select segments..."
        />
      </div>

      {/* Health Score */}
      <div>
        <label className={labelClass}>Health Score</label>
        <RangeSlider
          min={0}
          max={100}
          value={filters.healthScore}
          onChange={(value) => updateFilter('healthScore', value)}
        />
      </div>

      {/* Churn Risk */}
      <div>
        <label className={labelClass}>Churn Risk</label>
        <RangeSlider
          min={0}
          max={100}
          value={filters.churnRisk}
          onChange={(value) => updateFilter('churnRisk', value)}
          formatValue={(v) => `${v}%`}
        />
      </div>

      {/* Order Count */}
      <div>
        <label className={labelClass}>Order Count</label>
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
        <div className="text-[10px] text-gray-400 mt-0.5">
          {filters.orderCount[1] >= 100 ? '100+' : `Up to ${filters.orderCount[1]}`} orders
        </div>
      </div>

      {/* Total Spent */}
      <div>
        <label className={labelClass}>Total Spent</label>
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
        <div className="text-[10px] text-gray-400 mt-0.5">
          {filters.totalSpent[1] >= 500000 ? '₦500k+' : `Up to ₦${(filters.totalSpent[1] / 1000).toFixed(0)}k`}
        </div>
      </div>

      {/* Last Order Date */}
      <div>
        <label className={labelClass}>Last Order Date</label>
        <div className="space-y-1.5">
          <input
            type="date"
            value={filters.lastOrderDate.start}
            onChange={(e) => updateFilter('lastOrderDate', {
              ...filters.lastOrderDate,
              start: e.target.value
            })}
            className={inputClass}
          />
          <input
            type="date"
            value={filters.lastOrderDate.end}
            onChange={(e) => updateFilter('lastOrderDate', {
              ...filters.lastOrderDate,
              end: e.target.value
            })}
            className={inputClass}
          />
        </div>
      </div>

      {/* Tags */}
      {availableTags.length > 0 && (
        <div>
          <label className={labelClass}>Tags</label>
          <MultiSelect
            options={availableTags.map(tag => ({ id: tag.id, name: tag.name }))}
            selected={filters.tags}
            onChange={(selected) => updateFilter('tags', selected)}
            placeholder="Select tags..."
          />
        </div>
      )}

      {/* Sort */}
      <div>
        <label className={labelClass}>Sort By</label>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className={`${inputClass} mb-1.5`}
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
          className={inputClass}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
    </div>
  );
}
