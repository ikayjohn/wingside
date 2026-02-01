import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { csrfProtection } from '@/lib/csrf'

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
      .select('id, order_number, total, created_at, status')
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

    // Calculate tier based on total points
    // Tier Structure:
    // - Wing Member: 0 - 5,000 Points
    // - Wing Leader: 5,001 - 20,000 Points
    // - Wingzard: 20,000+ Points
    let currentTier = 'Wing Member'
    let nextTier = 'Wing Leader'
    let tierProgress = 0
    let tierThreshold = 5000
    let tierStart = 0

    const totalPoints = profile.total_points || 0

    if (totalPoints >= 20000) {
      currentTier = 'Wingzard'
      nextTier = 'Wingzard' // Max tier
      tierThreshold = 20000
      tierStart = 20000
      tierProgress = 100 // At max tier
    } else if (totalPoints >= 5001) {
      currentTier = 'Wing Leader'
      nextTier = 'Wingzard'
      tierThreshold = 20000
      tierStart = 5000
      tierProgress = ((totalPoints - tierStart) / (tierThreshold - tierStart)) * 100
    } else {
      currentTier = 'Wing Member'
      nextTier = 'Wing Leader'
      tierThreshold = 5000
      tierStart = 0
      tierProgress = ((totalPoints - tierStart) / (tierThreshold - tierStart)) * 100
    }

    // Clamp progress between 0 and 100
    if (tierProgress < 0) tierProgress = 0
    if (tierProgress > 100) tierProgress = 100

    // Calculate points this month (₦100 = 1 point)
    const pointsThisMonth = Math.floor(
      (orders?.filter(order => {
        const orderDate = new Date(order.created_at)
        const now = new Date()
        return orderDate.getMonth() === now.getMonth() &&
               orderDate.getFullYear() === now.getFullYear()
      })?.reduce((sum, order) => sum + Number(order.total), 0) || 0) / 100
    )

    // Parse date_of_birth to extract birthday day and month if not already stored
    let birthdayDay = profile.birthday_day
    let birthdayMonth = profile.birthday_month

    if (!birthdayDay && !birthdayMonth && profile.date_of_birth) {
      // date_of_birth is stored as DD-MM-YYYY or DD-MM format
      const dobParts = profile.date_of_birth.split('-')
      if (dobParts.length >= 2) {
        birthdayDay = parseInt(dobParts[0], 10)
        birthdayMonth = parseInt(dobParts[1], 10)
      }
    }

    const userData = {
      id: profile.id,
      name: profile.full_name || 'Customer',
      firstName: profile.first_name || profile.full_name?.split(' ')[0] || 'Customer',
      lastName: profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '',
      email: profile.email,
      phone: profile.phone,
      birthdayDay,
      birthdayMonth,
      points: profile.total_points || 0, // Add points field
      walletBalance: profile.wallet_balance || 0,
      cardNumber: `WC${profile.id.slice(0, 8).toUpperCase()}`,
      refId: profile.referral_code || 'N/A', // Use actual referral code from database
      referralCode: profile.referral_code, // Add the actual referral code from database
      totalPoints,
      pointsThisMonth,
      currentTier,
      memberSince,
      availableToConvert: totalPoints * 10, // 100% of points × ₦10 per point
      convertiblePoints: totalPoints, // All points are convertible
      minConversion: 100,
      tierProgress: {
        current: totalPoints,
        start: tierStart,
        target: tierThreshold,
        nextTier,
        percentage: Math.round(tierProgress),
        pointsToNext: Math.max(0, tierThreshold - totalPoints),
      },
      addresses: profile.addresses || [],
      recentOrders,
      totalOrders,
      totalSpent,
      role: profile.role,
      avatar_url: profile.avatar_url,
      current_streak: profile.current_streak || 0,
      longest_streak: profile.longest_streak || 0,
      streak_start_date: profile.streak_start_date,
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
    // Check CSRF token
    const csrfError = await csrfProtection(request)
    if (csrfError) {
      return csrfError
    }

    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { firstName, lastName, phone, birthdayDay, birthdayMonth } = body

    // Get current profile to check if birthday is already set
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, birthday_day, birthday_month')
      .eq('id', user.id)
      .single()

    // Prepare update data
    const updateData: any = {}

    if (firstName !== undefined) updateData.first_name = firstName
    if (lastName !== undefined) updateData.last_name = lastName
    if (phone !== undefined) updateData.phone = phone

    // Birthday can only be set if not already set
    if (birthdayDay !== undefined && birthdayMonth !== undefined) {
      if (currentProfile?.birthday_day && currentProfile?.birthday_month) {
        // Birthday already set, prevent changes
        return NextResponse.json(
          { error: 'Birthday cannot be changed once set. Please contact customer support.' },
          { status: 400 }
        )
      }
      updateData.birthday_day = birthdayDay
      updateData.birthday_month = birthdayMonth
      // Also save in date_of_birth field for consistency
      const day = String(birthdayDay).padStart(2, '0')
      const month = String(birthdayMonth).padStart(2, '0')
      updateData.date_of_birth = `${day}-${month}`
    }

    // Update full_name if first or last name changed
    if (firstName !== undefined || lastName !== undefined) {
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