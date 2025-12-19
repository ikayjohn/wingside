import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Port Harcourt delivery areas from the original checkout page
const portHarcourtAreas = [
  { name: 'New GRA', delivery_fee: 1000, display_order: 1 },
  { name: 'D-Line', delivery_fee: 1000, display_order: 2 },
  { name: 'Stadium Road', delivery_fee: 1000, display_order: 3 },
  { name: 'Old GRA', delivery_fee: 1000, display_order: 4 },
  { name: 'Town', delivery_fee: 1000, display_order: 5 },
  { name: 'Borokiri', delivery_fee: 1200, display_order: 6 },
  { name: 'Olu Obasanjo', delivery_fee: 1200, display_order: 7 },
  { name: 'Diobu Mile 1', delivery_fee: 1200, display_order: 8 },
  { name: 'Diobu Mile 2', delivery_fee: 1300, display_order: 9 },
  { name: 'Diobu Mile 3', delivery_fee: 1400, display_order: 10 },
  { name: 'Trans-Amadi', delivery_fee: 1500, display_order: 11 },
  { name: 'Shell RA', delivery_fee: 1500, display_order: 12 },
  { name: 'Elelenwo', description: 'near side', delivery_fee: 1600, display_order: 13 },
  { name: 'Rumuola', delivery_fee: 1700, display_order: 14 },
  { name: 'Rumuokwuta', delivery_fee: 1800, display_order: 15 },
  { name: 'Rumuigbo', delivery_fee: 1900, display_order: 16 },
  { name: 'Nkpogu', delivery_fee: 1900, display_order: 17 },
  { name: 'Peter Odili Road', delivery_fee: 2000, display_order: 18 },
  { name: 'Woji', delivery_fee: 2100, display_order: 19 },
  { name: 'Rumuomasi', delivery_fee: 2200, display_order: 20 },
  { name: 'Rumuodara', delivery_fee: 2300, display_order: 21 },
  { name: 'Oginigba', delivery_fee: 2300, display_order: 22 },
  { name: 'Rumuibekwe', delivery_fee: 2300, display_order: 23 },
  { name: 'Rumuodomaya', delivery_fee: 2400, display_order: 24 },
  { name: 'Rumuokoro', delivery_fee: 2700, display_order: 25 },
  { name: 'Rumunduru', delivery_fee: 2900, display_order: 26 },
  { name: 'Eliozu', delivery_fee: 3000, display_order: 27 },
  { name: 'Eliowhani', delivery_fee: 3100, display_order: 28 },
  { name: 'Mgbuoba', delivery_fee: 3200, display_order: 29 },
  { name: 'Okuru', delivery_fee: 3200, display_order: 30 },
  { name: 'Akpajo', delivery_fee: 3200, display_order: 31 },
  { name: 'Choba', delivery_fee: 3500, display_order: 32 },
  { name: 'Alakahia', delivery_fee: 3700, display_order: 33 },
  { name: 'Aluu', delivery_fee: 4000, display_order: 34 },
  { name: 'Igwuruta', delivery_fee: 4500, display_order: 35 },
  { name: 'Omagwa', delivery_fee: 4500, display_order: 36 },
  { name: 'Airport Road', delivery_fee: 5000, display_order: 37 },
]

async function seedPortHarcourtAreas() {
  console.log('Replacing delivery areas with Port Harcourt locations...\n')

  try {
    // Delete all existing delivery areas
    const { error: deleteError } = await supabase
      .from('delivery_areas')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('Error deleting existing areas:', deleteError)
      return
    }

    console.log('✅ Cleared existing delivery areas\n')

    // Insert Port Harcourt areas
    const areasToInsert = portHarcourtAreas.map(area => ({
      name: area.name,
      description: area.description || null,
      delivery_fee: area.delivery_fee,
      min_order_amount: 0,
      estimated_time: null,
      is_active: true,
      display_order: area.display_order,
    }))

    const { data, error: insertError } = await supabase
      .from('delivery_areas')
      .insert(areasToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting Port Harcourt areas:', insertError)
      return
    }

    console.log(`✅ Successfully inserted ${data.length} Port Harcourt delivery areas:\n`)

    // Group by fee for display
    const groupedByFee: Record<number, string[]> = {}
    data.forEach((area: any) => {
      if (!groupedByFee[area.delivery_fee]) {
        groupedByFee[area.delivery_fee] = []
      }
      groupedByFee[area.delivery_fee].push(area.name)
    })

    Object.keys(groupedByFee)
      .sort((a, b) => Number(a) - Number(b))
      .forEach(fee => {
        console.log(`₦${Number(fee).toLocaleString()}: ${groupedByFee[Number(fee)].join(', ')}`)
      })

    console.log('\n✅ Migration complete! Port Harcourt delivery areas are now active.')

  } catch (error: any) {
    console.error('Unexpected error:', error.message)
  }
}

seedPortHarcourtAreas()
