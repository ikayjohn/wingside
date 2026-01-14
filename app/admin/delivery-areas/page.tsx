'use client'

import { useState, useEffect } from 'react'

interface DeliveryArea {
  id: string
  name: string
  description?: string
  delivery_fee: number
  min_order_amount: number
  estimated_time?: string
  is_active: boolean
  display_order: number
}

export default function AdminDeliveryAreasPage() {
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null)
  const [bulkData, setBulkData] = useState<DeliveryArea[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    delivery_fee: 0,
    min_order_amount: 0,
    estimated_time: '',
    is_active: true,
    display_order: 0,
  })

  useEffect(() => {
    fetchDeliveryAreas(true) // Force bypass cache on initial load to get fresh data
  }, [])

  const fetchDeliveryAreas = async (bypassCache = false) => {
    try {
      const url = bypassCache
        ? `/api/delivery-areas?_timestamp=${Date.now()}`
        : '/api/delivery-areas'

      console.log('🔄 Fetching delivery areas:', { bypassCache, url })

      const response = await fetch(url, {
        cache: bypassCache ? 'no-store' : 'default',
        credentials: 'include', // Important: include cookies
        headers: bypassCache ? {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        } : {}
      })

      // Check response status before parsing
      if (!response.ok) {
        console.error('❌ Response not OK:', response.status, response.statusText)
        const text = await response.text()
        console.error('❌ Response body:', text.substring(0, 500))
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Get raw text first for debugging
      const rawText = await response.text()
      console.log('✅ Response received, length:', rawText.length)
      console.log('✅ Response preview:', rawText.substring(0, 200))

      // Parse JSON
      let data
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError)
        console.error('❌ Raw response:', rawText.substring(0, 500))
        throw new Error('Failed to parse API response as JSON')
      }

      console.log('📦 Fetched delivery areas:', data.deliveryAreas?.length, 'areas')

      if (data.deliveryAreas) {
        // Sort by display_order to ensure correct sequence (create new array to avoid mutation)
        const sorted = [...data.deliveryAreas].sort((a: DeliveryArea, b: DeliveryArea) => a.display_order - b.display_order)
        console.log('✅ Sorted delivery areas:', sorted.map(a => `${a.name} (${a.display_order})`))
        setDeliveryAreas(sorted)
      }
    } catch (error) {
      console.error('❌ Error fetching delivery areas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (area: DeliveryArea) => {
    setEditingArea(area)
    setFormData({
      name: area.name,
      description: area.description || '',
      delivery_fee: area.delivery_fee,
      min_order_amount: area.min_order_amount,
      estimated_time: area.estimated_time || '',
      is_active: area.is_active,
      display_order: area.display_order,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery area?')) return

    try {
      const response = await fetch(`/api/delivery-areas/${id}`, {
        method: 'DELETE',
        credentials: 'include', // Important: include cookies
      })

      if (response.ok) {
        alert('Delivery area deleted successfully')
        fetchDeliveryAreas(true)
      } else {
        alert('Failed to delete delivery area')
      }
    } catch (error) {
      console.error('Error deleting delivery area:', error)
      alert('Error deleting delivery area')
    }
  }

  const handleBulkEdit = () => {
    setBulkData([...deliveryAreas])
    setShowBulkEdit(true)
  }

  const handleBulkSave = async () => {
    try {
      console.log('💾 Saving bulk updates for', bulkData.length, 'areas')
      console.log('📋 Bulk data:', bulkData)

      // Confirm before saving
      const confirmed = confirm(`Update all ${bulkData.length} delivery areas?`)
      if (!confirmed) {
        console.log('❌ Cancelled by user')
        return
      }

      // Make requests sequentially instead of parallel to avoid auth issues
      const results = []
      let successCount = 0
      let failCount = 0

      for (const area of bulkData) {
        console.log(`📤 Updating area ${area.id}:`, area.name)

        try {
          const response = await fetch(`/api/delivery-areas/${area.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important: include cookies
            body: JSON.stringify(area),
          })

          if (response.ok) {
            console.log(`✅ Updated area ${area.name}`)
            successCount++
            results.push({ status: 'fulfilled', value: response })
          } else {
            const error = await response.json()
            console.error(`❌ Failed to update area ${area.name}:`, error)
            failCount++
            results.push({ status: 'rejected', reason: error })
          }
        } catch (error) {
          console.error(`❌ Error updating area ${area.name}:`, error)
          failCount++
          results.push({ status: 'rejected', reason: error })
        }
      }

      console.log(`✅ Bulk update complete: ${successCount} succeeded, ${failCount} failed`)

      if (failCount === 0) {
        alert(`All ${successCount} delivery areas updated successfully!`)
      } else if (successCount === 0) {
        alert('All updates failed. You may have been logged out. Please refresh and try again.')
        return // Don't refresh data if all failed
      } else {
        alert(`Update complete: ${successCount} succeeded, ${failCount} failed. Check console for details.`)
      }

      setShowBulkEdit(false)

      // Wait for cache invalidation to complete
      console.log('⏳ Waiting for cache to clear...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Force refresh with cache bypass
      console.log('🔄 Refreshing data...')
      await fetchDeliveryAreas(true)

      console.log('✅ Done!')
    } catch (error) {
      console.error('❌ Error in bulk save:', error)
      alert('Error saving bulk updates: ' + (error as Error).message)
    }
  }

  const updateBulkItem = (id: string, field: keyof DeliveryArea, value: any) => {
    setBulkData(prev => prev.map(area =>
      area.id === id ? { ...area, [field]: value } : area
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingArea
        ? `/api/delivery-areas/${editingArea.id}`
        : '/api/delivery-areas'

      const method = editingArea ? 'PUT' : 'POST'

      console.log('🚀 Sending request:', { method, url, formData, editingArea })

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify(formData),
      })

      console.log('📡 Response status:', response.status, response.ok)

      const responseData = await response.json()
      console.log('📦 Response data:', responseData)

      if (response.ok) {
        console.log('✅ Update successful, refreshing list...')
        alert(`Delivery area ${editingArea ? 'updated' : 'created'} successfully`)
        setShowForm(false)
        setEditingArea(null)
        setFormData({
          name: '',
          description: '',
          delivery_fee: 0,
          min_order_amount: 0,
          estimated_time: '',
          is_active: true,
          display_order: 0,
        })
        // Bypass cache to get fresh data
        fetchDeliveryAreas(true)
      } else {
        console.error('❌ Error response:', responseData)
        alert(`Failed to ${editingArea ? 'update' : 'create'} delivery area: ${responseData.error || responseData.details || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Error saving delivery area:', error)
      alert('Error saving delivery area')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price).replace('NGN', '₦')
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading delivery areas...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Areas</h1>
          <p className="text-gray-600 mt-2">Manage delivery zones and fees</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleBulkEdit}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            ✏️ Bulk Edit
          </button>
          <button
            onClick={() => {
              setEditingArea(null)
              setFormData({
                name: '',
                description: '',
                delivery_fee: 0,
                min_order_amount: 0,
                estimated_time: '',
                is_active: true,
                display_order: 0,
              })
              setShowForm(true)
            }}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            + Add New Area
          </button>
        </div>
      </div>

      {/* Delivery Areas Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Area Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Fee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Min Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Est. Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deliveryAreas.map((area) => (
              <tr key={area.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{area.name}</div>
                    {area.description && (
                      <div className="text-sm text-gray-500">{area.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(area.delivery_fee)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {formatPrice(area.min_order_amount)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {area.estimated_time || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      area.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {area.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(area)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(area.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {deliveryAreas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No delivery areas found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingArea ? 'Edit Delivery Area' : 'Add New Delivery Area'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingArea(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="e.g., Victoria Island"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="e.g., Victoria Island and Ikoyi"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Fee (₦) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.delivery_fee}
                      onChange={(e) => setFormData({ ...formData, delivery_fee: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="1500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Order Amount (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Time
                    </label>
                    <input
                      type="text"
                      value={formData.estimated_time}
                      onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="30-45 mins"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg transition-colors"
                  >
                    {editingArea ? 'Update Area' : 'Create Area'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingArea(null)
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Bulk Edit Delivery Areas</h2>
                  <p className="text-sm text-gray-600 mt-1">Edit all delivery areas and prices at once</p>
                </div>
                <button
                  onClick={() => setShowBulkEdit(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Fee (₦)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Order (₦)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bulkData.map((area) => (
                      <tr key={area.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={area.name}
                            onChange={(e) => updateBulkItem(area.id, 'name', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={area.description || ''}
                            onChange={(e) => updateBulkItem(area.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={area.delivery_fee}
                            onChange={(e) => updateBulkItem(area.id, 'delivery_fee', Number(e.target.value))}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={area.min_order_amount}
                            onChange={(e) => updateBulkItem(area.id, 'min_order_amount', Number(e.target.value))}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={area.estimated_time || ''}
                            onChange={(e) => updateBulkItem(area.id, 'estimated_time', e.target.value)}
                            className="w-28 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                            placeholder="30-45 mins"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={area.is_active ? 'active' : 'inactive'}
                            onChange={(e) => updateBulkItem(area.id, 'is_active', e.target.value === 'active')}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Editing {bulkData.length} delivery area{bulkData.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBulkEdit(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkSave}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Save All Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
