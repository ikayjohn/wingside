import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/user/profile - Fetch authenticated user's profile data
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error in profile API:', authError)
      return NextResponse.json({ error: 'Authentication failed', details: authError.message }, { status: 401 })
    }

    if (!user) {
      console.log('No user found in profile API')
      return NextResponse.json({ error: 'Unauthorized - No user session found' }, { status: 401 })
    }

    // Fetch user's profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        addresses:addresses(*)
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // Fetch user's order statistics
    const { data: orders } = await supabase
      .from('orders')
      .select('total, created_at, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Calculate statistics
    const totalOrders = orders?.length || 0
    const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0
    const recentOrders = orders?.slice(0, 5) || []

    // Calculate member since date
    const memberSince = profile?.created_at 
      ? new Date(profile.created_at).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        }).replace(/\//g, '/')
      : 'N/A'

    // Calculate tier based on total spent (you can adjust these thresholds)
    let currentTier = 'Wing Newcomer'
    let nextTier = 'Wing Leader'
    let tierProgress = 0
    let tierThreshold = 0

    if (totalSpent >= 50000) {
      currentTier = 'Wingzard'
      nextTier = 'Wing Legend'
      tierThreshold = 100000
    } else if (totalSpent >= 20000) {
      currentTier = 'Wing Leader'
      nextTier = 'Wingzard'
      tierThreshold = 50000
    } else if (totalSpent >= 10000) {
      currentTier = 'Wing Enthusiast'
      nextTier = 'Wing Leader'
      tierThreshold = 20000
    } else if (totalSpent >= 5000) {
      currentTier = 'Wing Fan'
      nextTier = 'Wing Enthusiast'
      tierThreshold = 10000
    } else {
      currentTier = 'Wing Newcomer'
      nextTier = 'Wing Fan'
      tierThreshold = 5000
    }

    // Calculate progress to next tier
    const previousThreshold = tierThreshold * 0.5
    tierProgress = ((totalSpent - previousThreshold) / (tierThreshold - previousThreshold)) * 100
    if (tierProgress < 0) tierProgress = 0
    if (tierProgress > 100) tierProgress = 100

    // Generate mock data for points and wallet (since these aren't fully implemented yet)
    // TODO: Replace with real wallet/loyalty data when available
    const totalPoints = profile.points || Math.floor(totalSpent / 100) // 1 point per ₦100 spent
    const pointsThisMonth = Math.floor(
      (orders?.filter(order => {
        const orderDate = new Date(order.created_at)
        const now = new Date()
        return orderDate.getMonth() === now.getMonth() &&
               orderDate.getFullYear() === now.getFullYear()
      })?.reduce((sum, order) => sum + Number(order.total), 0) || 0) / 100
    )

    const userData = {
      id: profile.id,
      name: profile.full_name || 'Customer',
      firstName: profile.first_name || profile.full_name?.split(' ')[0] || 'Customer',
      lastName: profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '',
      email: profile.email,
      phone: profile.phone,
      birthdayDay: profile.birthday_day,
      birthdayMonth: profile.birthday_month,
      points: profile.points || totalPoints, // Add points field
      walletBalance: profile.wallet_balance || 0,
      cardNumber: `WC${profile.id.slice(0, 8).toUpperCase()}`,
      bankAccount: '9012345678', // This would come from payment system
      bankName: 'Wingside Bank',
      refId: `Wingman${profile.full_name?.replace(/\s+/g, '') || 'Customer'}`,
      referralCode: profile.referral_code, // Add the actual referral code from database
      totalPoints,
      pointsThisMonth,
      currentTier,
      memberSince,
      availableToConvert: profile.wallet_balance || 0,
      convertiblePoints: Math.floor(totalPoints * 0.5), // Convertible points
      minConversion: 100,
      tierProgress: {
        current: Math.max(0, tierThreshold - (totalSpent - previousThreshold)),
        target: tierThreshold,
        nextTier,
        percentage: Math.round(tierProgress),
      },
      addresses: profile.addresses || [],
      recentOrders,
      totalOrders,
      totalSpent,
      role: profile.role,
    }

    return NextResponse.json({ profile: userData })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/user/profile - Update authenticated user's profile
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, phone, birthdayDay, birthdayMonth } = body

    // Prepare update data
    const updateData: any = {}

    if (firstName !== undefined) updateData.first_name = firstName
    if (lastName !== undefined) updateData.last_name = lastName
    if (phone !== undefined) updateData.phone = phone
    if (birthdayDay !== undefined) updateData.birthday_day = birthdayDay
    if (birthdayMonth !== undefined) updateData.birthday_month = birthdayMonth

    // Update full_name if first or last name changed
    if (firstName !== undefined || lastName !== undefined) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      const newFirstName = firstName ?? currentProfile?.first_name
      const newLastName = lastName ?? currentProfile?.last_name
      updateData.full_name = `${newFirstName} ${newLastName}`.trim()
    }

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile, success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}