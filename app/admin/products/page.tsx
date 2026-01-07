'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  simple_flavors?: string[]
  flavor_label?: string
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
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
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')

  // Subcategory options by category (must match order page)
  const subcategoryOptions: Record<string, string[]> = {
    'Wing Cafe': [
      'Coffee Classics',
      'Everyday Sips',
      'Toasted & Spiced Lattes',
      'Gourmet & Dessert-Inspired Lattes',
      'Matcha Lattes',
      'Chai Lattes',
      'Hot Smelts',
      'Teas',
      'Wingfreshers',
      'Milkshakes',
      'Signature Pairings'
    ],
  }

  // Get subcategory options for selected category
  const getSubcategoryOptions = () => {
    const selectedCat = categories.find(c => c.id === formData.category_id)
    if (!selectedCat) return []
    return subcategoryOptions[selectedCat.name] || []
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
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
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
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

    setEditingProduct(product)
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
      sizes: [
        {
          name: 'Regular',
          price: formData.price,
          is_default: true,
        },
      ],
    }

    console.log('[Product Submit] productData being sent to API:', { ...productData, image_url: productData.image_url?.substring(0, 50) + '...' })

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
            })
            setImagePreview('')
            setShowForm(true)
          }}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          + Add New Product
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-yellow-400 text-black'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({products.length})
        </button>
        {categories.map((category) => {
          const count = products.filter(p => p.category.name === category.name).length
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedCategory === category.name
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Flavors
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
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-12 w-12 flex-shrink-0">
                      <img
                        className="h-12 w-12 rounded-lg object-cover"
                        src={product.image_url}
                        alt={product.name}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      {product.subcategory && (
                        <div className="text-sm text-gray-500">{product.subcategory}</div>
                      )}
                      {product.wing_count && (
                        <div className="text-xs text-gray-400">{product.wing_count}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{product.category.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(product.sizes[0]?.price || 0)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {product.simple_flavors && product.simple_flavors.length > 0 ? (
                      <span className="text-xs text-gray-600">
                        {product.simple_flavors.slice(0, 3).join(', ')}
                        {product.simple_flavors.length > 3 && '...'}
                      </span>
                    ) : product.flavors.length > 0 ? (
                      <span className="text-xs text-gray-600">
                        {product.flavors.length} wing flavors
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No flavors</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
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
