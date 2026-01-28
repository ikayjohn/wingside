import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Debug endpoint to check products with specific subcategory
 * Usage: /api/debug/products?subcategory=matchas
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const subcategory = searchParams.get('subcategory') || 'matchas'
    const category = searchParams.get('category') || 'Wing Cafe'

    const supabase = await createClient()

    // Get category ID
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('name', category)
      .single()

    if (!categoryData) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Get products with category join
    const { data: productsWithJoin } = await supabase
      .from('products')
      .select('id, name, category, subcategory, is_active')
      .eq('category_id', categoryData.id)
      .order('subcategory')

    // Get products filtering by subcategory (how order page does it)
    const filteredBySubcategory = productsWithJoin?.filter(p =>
      p.subcategory === subcategory
    ) || []

    // Case-insensitive filter
    const filteredCaseInsensitive = productsWithJoin?.filter(p =>
      p.subcategory?.toLowerCase() === subcategory.toLowerCase()
    ) || []

    // Get subcategories for this category
    const { data: subcategories } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryData.id)
      .order('display_order')

    return NextResponse.json({
      category,
      categoryId: categoryData.id,
      requestedSubcategory: subcategory,
      totalProductsInCategory: productsWithJoin?.length || 0,
      productsMatchingExactCase: filteredBySubcategory.length,
      productsMatchingCaseInsensitive: filteredCaseInsensitive.length,
      productsWithJoin: productsWithJoin,
      filteredProductsExactCase: filteredBySubcategory,
      filteredProductsCaseInsensitive: filteredCaseInsensitive,
      subcategories,
      debugInfo: {
        requested: subcategory,
        availableSubcategories: subcategories?.map(s => s.name),
        products: productsWithJoin?.map(p => ({
          id: p.id,
          name: p.name,
          subcategory: p.subcategory,
          isActive: p.is_active
        }))
      }
    })
  } catch (error) {
    console.error('[Debug Products] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
