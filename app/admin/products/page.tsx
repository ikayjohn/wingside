'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRoleAccess } from '@/lib/hooks/useRoleAccess'

interface Product {
  id: string
  name: string
  category: { id: string; name: string; slug: string }
  subcategory?: string
  description?: string
  image_url: string
  wing_count?: string
  max_flavors?: number
  badge?: string
  is_active: boolean
  sizes: { name: string; price: number }[]
  flavors: string[]
  flavor_ids?: string[]
  simple_flavors?: string[]
  flavor_label?: string
  addons?: Array<{
    id: string
    type: 'rice' | 'drink' | 'milkshake' | 'cake'
    name: string
    price: number
    max_selections: number
  }>
}

interface Category {
  id: string
  name: string
  slug: string
  subcategories?: { id: string; name: string }[]
}

interface Flavor {
  id: string
  name: string
  category: string
}

export default function AdminProductsPage() {
  const router = useRouter()
  const { canEdit } = useRoleAccess({
    requiredPermission: 'products',
    requiredLevel: 'view',
  })
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    subcategory: '',
    description: '',
    image_url: '',
    max_flavors: 1,
    badge: '',
    price: 0,
    simple_flavors: '',
    flavor_label: '',
    is_active: true,
    rice_options: '',
    rice_count: 1,
    drink_options: '',
    drink_count: 1,
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')


  // Get subcategory options for selected category
  const getSubcategoryOptions = () => {
    const selectedCat = categories.find(c => c.id === formData.category_id)
    if (!selectedCat) return []
    return selectedCat.subcategories?.map(s => s.name) || []
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchFlavors()
  }, [])

  const fetchProducts = async () => {
    try {
      // Add cache-busting header and timestamp for admin pages
      // Also request inactive products for management
      const response = await fetch(`/api/products/?includeInactive=true&_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      })
      const data = await response.json()
      if (data.products) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      })
      const data = await response.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchFlavors = async () => {
    try {
      const response = await fetch('/api/flavors')
      const data = await response.json()
      if (data.flavors) {
        setFlavors(data.flavors)
      }
    } catch (error) {
      console.error('Error fetching flavors:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Product deleted successfully')
        fetchProducts()
      } else {
        alert('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  const handleEdit = (product: Product) => {
    console.log('[Product Edit] Loading product:', product.name)
    console.log('[Product Edit] Product subcategory:', product.subcategory)
    console.log('[Product Edit] Category:', product.category.name)
    console.log('[Product Edit] Product addons:', product.addons)

    // Transform addons into form format
    const riceAddons = product.addons?.filter(a => a.type === 'rice') || []
    const drinkAddons = product.addons?.filter(a => a.type === 'drink') || []
    const riceCount = riceAddons.length > 0 ? riceAddons[0].max_selections : 1
    const drinkCount = drinkAddons.length > 0 ? drinkAddons[0].max_selections : 1

    // Convert rice addons to "Name:Price" format
    const riceOptionsString = riceAddons
      .map(a => a.price > 0 ? `${a.name}:${a.price}` : a.name)
      .join(', ')

    // Convert drink addons to "Name:Price" format (for future use)
    const drinkOptionsString = drinkAddons
      .map(a => a.price > 0 ? `${a.name}:${a.price}` : a.name)
      .join(', ')

    setEditingProduct(product)

    // Set selected flavor IDs if available
    if (product.flavor_ids && product.flavor_ids.length > 0) {
      setSelectedFlavorIds(product.flavor_ids)
    } else {
      // Match flavor names to IDs if flavor_ids not available
      const flavorIds = product.flavors
        .map(flavorName => {
          const flavor = flavors.find(f => f.name === flavorName)
          return flavor?.id
        })
        .filter(Boolean) as string[]
      setSelectedFlavorIds(flavorIds)
    }

    setFormData({
      name: product.name,
      category_id: product.category.id,
      subcategory: product.subcategory || '',
      description: product.description || '',
      image_url: product.image_url,
      max_flavors: product.max_flavors || 1,
      badge: product.badge || '',
      price: product.sizes[0]?.price || 0,
      simple_flavors: product.simple_flavors?.join(', ') || '',
      flavor_label: product.flavor_label || '',
      is_active: product.is_active,
      rice_options: riceOptionsString,
      rice_count: riceCount,
      drink_options: drinkOptionsString,
      drink_count: drinkCount,
    })

    console.log('[Product Edit] formData.subcategory set to:', product.subcategory || '')

    setImagePreview(product.image_url)
    setShowForm(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    setUploadingImage(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'product-images') // Specify folder

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      console.log('[Product Upload] Upload response:', data)
      console.log('[Product Upload] Response OK:', response.ok)
      console.log('[Product Upload] Has URL:', !!data.url)

      if (response.ok && data.url) {
        console.log('[Product Upload] Setting image URL:', data.url)
        console.log('[Product Upload] Current formData before update:', formData)

        // Update formData with new image URL
        setFormData(prev => {
          const updated = { ...prev, image_url: data.url };
          console.log('[Product Upload] New formData:', updated);
          console.log('[Product Upload] image_url in new formData:', updated.image_url);
          return updated;
        });

        // Update preview with cache-busting timestamp
        setImagePreview(data.url + '?t=' + Date.now());
        console.log('[Product Upload] Image preview set to:', data.url + '?t=' + Date.now())

        alert('Image uploaded successfully!')
      } else {
        alert('Failed to upload image: ' + (data.error || 'Unknown error'))
        setImagePreview(formData.image_url) // Reset to original
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading image')
      setImagePreview(formData.image_url) // Reset to original
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('[Product Submit] Form data being submitted:', formData)
    console.log('[Product Submit] image_url in formData:', formData.image_url)

    // Transform rice and drink options into addons
    const addons: Array<{
      type: 'rice' | 'drink' | 'milkshake' | 'cake'
      name: string
      price: number
      max_selections: number
    }> = []

    // Add rice addons
    if (formData.rice_options) {
      const riceOptions = formData.rice_options.split(',').map(r => r.trim()).filter(r => r)
      riceOptions.forEach(riceOption => {
        // Parse "Name:Price" format
        const parts = riceOption.split(':')
        const name = parts[0].trim()
        const price = parts.length > 1 ? parseInt(parts[1].trim()) || 0 : 0

        addons.push({
          type: 'rice',
          name: name,
          price: price,
          max_selections: formData.rice_count || 1,
        })
      })
    }

    // Add drink addons
    if (formData.drink_options) {
      const drinkOptions = formData.drink_options.split(',').map(d => d.trim()).filter(d => d)
      drinkOptions.forEach(drinkName => {
        addons.push({
          type: 'drink',
          name: drinkName,
          price: 0, // Drink options don't have individual prices in the current implementation
          max_selections: formData.drink_count || 1,
        })
      })
    }

    const productData = {
      name: formData.name,
      category_id: formData.category_id,
      subcategory: formData.subcategory || null,
      description: formData.description || null,
      image_url: formData.image_url,
      max_flavors: formData.max_flavors || null,
      badge: formData.badge || null,
      simple_flavors: formData.simple_flavors
        ? formData.simple_flavors.split(',').map(f => f.trim())
        : null,
      flavor_label: formData.flavor_label || null,
      is_active: formData.is_active,
      flavor_ids: selectedFlavorIds,
      addons: addons.length > 0 ? addons : undefined,
      sizes: [
        {
          name: 'Regular',
          price: formData.price,
          is_default: true,
        },
      ],
    }

    console.log('[Product Submit] productData being sent to API:', { ...productData, image_url: productData.image_url?.substring(0, 50) + '...' })
    console.log('[Product Submit] flavor_ids being sent:', productData.flavor_ids)
    console.log('[Product Submit] flavor_ids length:', productData.flavor_ids?.length)
    console.log('[Product Submit] sizes array:', productData.sizes)
    console.log('[Product Submit] addons array:', productData.addons)

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'

      const method = editingProduct ? 'PUT' : 'POST'

      console.log('[Product Submit] Sending', method, 'request to', url)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      console.log('[Product Submit] Response status:', response.status)

      if (response.ok) {
        alert(`Product ${editingProduct ? 'updated' : 'created'} successfully`)
        setShowForm(false)
        setEditingProduct(null)
        setSelectedFlavorIds([])
        setFormData({
          name: '',
          category_id: '',
          subcategory: '',
          description: '',
          image_url: '',
          max_flavors: 1,
          badge: '',
          price: 0,
          simple_flavors: '',
          flavor_label: '',
          is_active: true,
          rice_options: '',
          rice_count: 1,
          drink_options: '',
          drink_count: 1,
        })
        fetchProducts()
      } else {
        const error = await response.json()
        alert(`Failed to ${editingProduct ? 'update' : 'create'} product: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error saving product')
    }
  }

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category.name === selectedCategory)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price).replace('NGN', '₦')
  }

  // Light colors for category tabs
  const tabColors = [
    { bg: '#FEF3C7', text: '#92400E' }, // amber-100 / amber-800
    { bg: '#DBEAFE', text: '#1E40AF' }, // blue-100 / blue-800
    { bg: '#FEE2E2', text: '#991B1B' }, // red-100 / red-800
    { bg: '#D1FAE5', text: '#065F46' }, // green-100 / green-800
    { bg: '#EDE9FE', text: '#5B21B6' }, // violet-100 / violet-800
    { bg: '#FAE8FF', text: '#86198F' }, // fuchsia-100 / fuchsia-800
    { bg: '#FFEDD5', text: '#9A3412' }, // orange-100 / orange-800
    { bg: '#E0F2FE', text: '#075985' }, // sky-100 / sky-800
    { bg: '#F3E8FF', text: '#6B21A8' }, // purple-100 / purple-800
    { bg: '#CCFBF1', text: '#115E59' }, // teal-100 / teal-800
  ]

  const getTabColor = (index: number, isActive: boolean) => {
    if (isActive) {
      return { bg: '#F7C400', text: '#000000' }
    }
    return tabColors[index % tabColors.length]
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600 mt-2">Manage your menu items</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null)
            setSelectedFlavorIds([])
            setFormData({
              name: '',
              category_id: '',
              subcategory: '',
              description: '',
              image_url: '',
              max_flavors: 1,
              badge: '',
              price: 0,
              simple_flavors: '',
              flavor_label: '',
              is_active: true,
              rice_options: '',
              rice_count: 1,
              drink_options: '',
              drink_count: 1,
            })
            setImagePreview('')
            setShowForm(true)
          }}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canEdit}
        >
          + Add New Product
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className="px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap hover:opacity-80"
          style={{
            fontSize: '13px',
            backgroundColor: selectedCategory === 'all' ? '#F7C400' : '#F3F4F6',
            color: selectedCategory === 'all' ? '#000000' : '#374151'
          }}
        >
          All ({products.length})
        </button>
        {categories.map((category, index) => {
          const count = products.filter(p => p.category.name === category.name).length
          const isActive = selectedCategory === category.name
          const colors = getTabColor(index, isActive)
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className="px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap hover:opacity-80"
              style={{
                fontSize: '13px',
                backgroundColor: colors.bg,
                color: colors.text
              }}
            >
              {category.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Product
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Category
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                Price
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                Status
              </th>
              <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-12 w-12 flex-shrink-0">
                      <img
                        className="h-12 w-12 rounded-lg object-cover"
                        src={product.image_url}
                        alt={product.name}
                      />
                    </div>
                    <div className="ml-2">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{product.name}</div>
                      {product.subcategory && (
                        <div className="text-sm text-gray-500 truncate max-w-[180px]">{product.subcategory}</div>
                      )}
                      {product.wing_count && (
                        <div className="text-xs text-gray-400">{product.wing_count}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 truncate block">{product.category.name}</span>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(product.sizes[0]?.price || 0)}
                  </span>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit ? (
                    <>
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400">View Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found in this category</p>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingProduct(null)
                    setSelectedFlavorIds([])
                    setImagePreview('')
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
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="e.g., Chicken Wings"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category_id}
                      onChange={(e) => {
                        setFormData({ ...formData, category_id: e.target.value, subcategory: '' })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory
                      {formData.subcategory && (
                        <span className="ml-2 text-xs text-green-600">
                          (Selected: {formData.subcategory})
                        </span>
                      )}
                    </label>
                    {getSubcategoryOptions().length > 0 ? (
                      <select
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      >
                        <option value="">Select subcategory</option>
                        {getSubcategoryOptions().map((subcat) => (
                          <option key={subcat} value={subcat}>
                            {subcat}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value="No subcategories available"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                    )}
                  </div>
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image *
                  </label>

                  {/* Image Preview */}
                  {(imagePreview || formData.image_url) && (
                    <div className="mb-3">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 transition-colors bg-gray-50">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG, WEBP or GIF (max 5MB)
                  </p>

                  {/* Manual URL Input (Optional) */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Or enter image URL manually:
                    </label>
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value })
                        setImagePreview(e.target.value)
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="/order-product-name.jpg or https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₦) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="5000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Badge
                    </label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Seasonal, New, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Flavors
                    </label>
                    <input
                      type="number"
                      value={formData.max_flavors}
                      onChange={(e) => setFormData({ ...formData, max_flavors: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of flavors customer can choose
                    </p>
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
                    <p className="text-xs text-gray-500 mt-1">
                      Inactive products won't show on order page
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Available Wing Flavors
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFlavorIds(flavors.map(f => f.id))}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFlavorIds([])}
                        className="text-[10px] font-bold text-red-600 hover:text-red-800 uppercase tracking-wider"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {flavors.length === 0 ? (
                      <p className="text-sm text-gray-500">Loading flavors...</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {flavors.map((flavor) => (
                          <label key={flavor.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedFlavorIds.includes(flavor.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFlavorIds([...selectedFlavorIds, flavor.id])
                                } else {
                                  setSelectedFlavorIds(selectedFlavorIds.filter(id => id !== flavor.id))
                                }
                              }}
                              className="rounded border-gray-300 text-yellow-400 focus:ring-yellow-400"
                            />
                            <span className="text-sm text-gray-700">{flavor.name}</span>
                            <span className="text-xs text-gray-400">({flavor.category})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select all wing flavors available for this product
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Simple Flavors (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.simple_flavors}
                    onChange={(e) => setFormData({ ...formData, simple_flavors: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Regular, Hot, Iced"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For products with simple options like Hot/Iced, Regular, etc.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Flavor Label
                  </label>
                  <input
                    type="text"
                    value={formData.flavor_label}
                    onChange={(e) => setFormData({ ...formData, flavor_label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Temperature, Tea Type, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rice Options (comma-separated, use "Name:Price" format for paid options)
                  </label>
                  <input
                    type="text"
                    value={formData.rice_options}
                    onChange={(e) => setFormData({ ...formData, rice_options: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Jollof Rice:0, Fried Rice:0, Coconut Rice:500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use "Name:Price" format (e.g., "Coconut Rice:500"). Free options: "Jollof Rice:0" or just "Jollof Rice"
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Rice Selections
                  </label>
                  <input
                    type="number"
                    value={formData.rice_count}
                    onChange={(e) => setFormData({ ...formData, rice_count: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="1"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many rice options can customer select
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drink Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.drink_options}
                    onChange={(e) => setFormData({ ...formData, drink_options: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Coke, Fanta, Sprite, Water"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For meal deals with drink options
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Drink Selections
                  </label>
                  <input
                    type="number"
                    value={formData.drink_count}
                    onChange={(e) => setFormData({ ...formData, drink_count: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="1"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many drink options can customer select
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    rows={3}
                    placeholder="Product description..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg transition-colors"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingProduct(null)
                      setSelectedFlavorIds([])
                      setImagePreview('')
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
    </div>
  )
}
