'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Subcategory {
    id: string
    name: string
    is_active: boolean
    display_order: number
}

interface Category {
    id: string
    name: string
    is_active: boolean
    display_order: number
    subcategories: Subcategory[]
}

export default function AdminCategoriesPage() {
    const router = useRouter()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    // Modal states
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [showSubcategoryModal, setShowSubcategoryModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [editingSubcategory, setEditingSubcategory] = useState<{ sub: Subcategory, catId: string } | null>(null)
    const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null)

    // Form states
    const [categoryForm, setCategoryForm] = useState({ name: '', display_order: 0, is_active: true })
    const [subcategoryForm, setSubcategoryForm] = useState({ name: '', display_order: 0, is_active: true })

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories?includeInactive=true&_t=' + Date.now())
            const data = await response.json()
            if (data.categories) {
                setCategories(data.categories)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoading(false)
        }
    }

    // --- Category Handlers ---

    const handleAddCategory = () => {
        setEditingCategory(null)
        setCategoryForm({ name: '', display_order: categories.length + 1, is_active: true })
        setShowCategoryModal(true)
    }

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category)
        setCategoryForm({
            name: category.name,
            display_order: category.display_order || 0,
            is_active: category.is_active
        })
        setShowCategoryModal(true)
    }

    const saveCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
            const method = editingCategory ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryForm)
            })

            if (response.ok) {
                setShowCategoryModal(false)
                fetchCategories()
            } else {
                const error = await response.json()
                alert('Failed to save category: ' + (error.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Error saving category:', error)
        }
    }

    const toggleCategory = async (category: Category) => {
        try {
            const response = await fetch(`/api/categories/${category.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...category, is_active: !category.is_active })
            })

            if (response.ok) {
                setCategories(prev => prev.map(c =>
                    c.id === category.id ? { ...c, is_active: !c.is_active } : c
                ))
            } else {
                alert('Failed to update category visibility')
            }
        } catch (error) {
            console.error('Error toggling category:', error)
        }
    }

    // --- Subcategory Handlers ---

    const handleAddSubcategory = (categoryId: string) => {
        setCurrentCategoryId(categoryId)
        setEditingSubcategory(null)
        const cat = categories.find(c => c.id === categoryId)
        setSubcategoryForm({
            name: '',
            display_order: (cat?.subcategories?.length || 0) + 1,
            is_active: true
        })
        setShowSubcategoryModal(true)
    }

    const handleEditSubcategory = (sub: Subcategory, categoryId: string) => {
        setCurrentCategoryId(categoryId)
        setEditingSubcategory({ sub, catId: categoryId })
        setSubcategoryForm({
            name: sub.name,
            display_order: sub.display_order || 0,
            is_active: sub.is_active
        })
        setShowSubcategoryModal(true)
    }

    const saveSubcategory = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editingSubcategory ? `/api/subcategories/${editingSubcategory.sub.id}` : '/api/subcategories'
            const method = editingSubcategory ? 'PUT' : 'POST'

            const payload = editingSubcategory
                ? subcategoryForm
                : { ...subcategoryForm, category_id: currentCategoryId }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                setShowSubcategoryModal(false)
                fetchCategories()
            } else {
                const error = await response.json()
                alert('Failed to save subcategory: ' + (error.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Error saving subcategory:', error)
        }
    }

    const toggleSubcategory = async (sub: Subcategory, categoryId: string) => {
        try {
            const response = await fetch(`/api/subcategories/${sub.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...sub, is_active: !sub.is_active })
            })

            if (response.ok) {
                setCategories(prev => prev.map(c => {
                    if (c.id === categoryId) {
                        return {
                            ...c,
                            subcategories: c.subcategories.map(s =>
                                s.id === sub.id ? { ...s, is_active: !s.is_active } : s
                            )
                        }
                    }
                    return c
                }))
            } else {
                alert('Failed to update subcategory visibility')
            }
        } catch (error) {
            console.error('Error toggling subcategory:', error)
        }
    }

    if (loading) {
        return <div className="p-8 text-gray-600">Loading categories...</div>
    }

    return (
        <div className="p-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
                    <p className="text-gray-600 mt-2">Manage your product categories and sub-categories.</p>
                </div>
                <button
                    onClick={handleAddCategory}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Category
                </button>
            </div>

            <div className="space-y-6">
                {categories.map((category) => (
                    <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Category Header */}
                        <div className="p-5 flex items-center justify-between bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg text-gray-900">{category.name}</span>
                                        {!category.is_active && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">Hidden</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">Order: {category.display_order}</span>
                                </div>
                                <button
                                    onClick={() => handleEditCategory(category)}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                    title="Edit Category"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleAddSubcategory(category.id)}
                                    className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Sub-cat
                                </button>
                                <div className="h-6 w-px bg-gray-200"></div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={category.is_active}
                                        onChange={() => toggleCategory(category)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                                </label>
                            </div>
                        </div>

                        {/* Subcategories Grid */}
                        <div className="p-5">
                            {category.subcategories && category.subcategories.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {category.subcategories.map((sub) => (
                                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-800">{sub.name}</span>
                                                    <span className="text-[10px] text-gray-400">Order: {sub.display_order}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleEditSubcategory(sub, category.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 p-1 transition-all"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                {!sub.is_active && <span className="text-[10px] text-red-500 font-bold uppercase ring-1 ring-red-100 px-1 rounded">Off</span>}
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer scale-75 transform origin-right">
                                                <input
                                                    type="checkbox"
                                                    checked={sub.is_active}
                                                    onChange={() => toggleSubcategory(sub, category.id)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                                    <p className="text-sm text-gray-400">No sub-categories yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* --- Modals --- */}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <form onSubmit={saveCategory}>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={categoryForm.name}
                                        onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                        placeholder="e.g., Starters"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Order</label>
                                    <input
                                        type="number"
                                        required
                                        value={categoryForm.display_order}
                                        onChange={e => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="cat_active"
                                        checked={categoryForm.is_active}
                                        onChange={e => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400"
                                    />
                                    <label htmlFor="cat_active" className="text-sm font-medium text-gray-700">Display on order page</label>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-white transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-all shadow-md active:scale-95"
                                >
                                    {editingCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Subcategory Modal */}
            {showSubcategoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <form onSubmit={saveSubcategory}>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">{editingSubcategory ? 'Edit Sub-category' : 'Add Sub-category'}</h2>
                                <button type="button" onClick={() => setShowSubcategoryModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sub-category Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={subcategoryForm.name}
                                        onChange={e => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                        placeholder="e.g., Iced Coffees"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Order</label>
                                    <input
                                        type="number"
                                        required
                                        value={subcategoryForm.display_order}
                                        onChange={e => setSubcategoryForm({ ...subcategoryForm, display_order: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="sub_active"
                                        checked={subcategoryForm.is_active}
                                        onChange={e => setSubcategoryForm({ ...subcategoryForm, is_active: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400"
                                    />
                                    <label htmlFor="sub_active" className="text-sm font-medium text-gray-700">Display under category</label>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowSubcategoryModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-white transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-all shadow-md active:scale-95"
                                >
                                    {editingSubcategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
