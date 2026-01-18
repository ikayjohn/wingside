import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { calculateLeadScore } from '@/lib/lead-scoring'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/leads/[id]/score - Recalculate lead score
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch lead with activity count
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        activities(count)
      `)
      .eq('id', params.id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Calculate new score
    const factors = {
      source: lead.source,
      budget: lead.budget,
      timeline: lead.timeline,
      interest_level: lead.interest_level,
      estimated_value: lead.estimated_value,
      activities_count: lead.activities?.[0]?.count || 0,
      last_contacted_at: lead.last_contacted_at,
      converted: lead.status === 'converted'
    }

    const newScore = calculateLeadScore(factors)

    // Update lead score
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        score: newScore,
        score_updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      previous_score: lead.score,
      new_score: newScore,
      lead: updatedLead
    })
  } catch (error: any) {
    console.error('Error updating lead score:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update lead score' },
      { status: 500 }
    )
  }
}

// GET /api/leads/[id]/score - Get lead score analysis
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const { data: lead, error } = await supabase
      .from('leads')
      .select(`
        *,
        activities(count)
      `)
      .eq('id', params.id)
      .single()

    if (error || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Analyze score breakdown
    const factors = {
      source: lead.source,
      budget: lead.budget,
      timeline: lead.timeline,
      interest_level: lead.interest_level,
      estimated_value: lead.estimated_value,
      activities_count: lead.activities?.[0]?.count || 0,
      last_contacted_at: lead.last_contacted_at,
      converted: lead.status === 'converted'
    }

    const score = calculateLeadScore(factors)

    // Score breakdown
    const breakdown = {
      source: {
        points: (() => {
          const scores: Record<string, number> = {
            referral: 20, partner: 15, event: 12, social: 10, website: 8, other: 5
          }
          return scores[lead.source] || 5
        })(),
        label: 'Source',
        value: lead.source
      },
      budget: {
        points: (() => {
          const scores: Record<string, number> = {
            high: 20, medium: 12, low: 5, not_specified: 0
          }
          return scores[lead.budget || 'not_specified']
        })(),
        label: 'Budget',
        value: lead.budget || 'Not specified'
      },
      timeline: {
        points: (() => {
          const scores: Record<string, number> = {
            immediate: 20, '1-3_months': 15, '3-6_months': 10,
            '6-12_months': 5, not_sure: 2
          }
          return scores[lead.timeline || 'not_sure']
        })(),
        label: 'Timeline',
        value: lead.timeline || 'Not specified'
      },
      interest_level: {
        points: (() => {
          const scores: Record<string, number> = {
            high: 20, medium: 10, low: 3
          }
          return scores[lead.interest_level || 'low']
        })(),
        label: 'Interest Level',
        value: lead.interest_level || 'Not specified'
      },
      estimated_value: {
        points: (() => {
          if (!lead.estimated_value) return 0
          if (lead.estimated_value >= 100000) return 10
          if (lead.estimated_value >= 50000) return 7
          if (lead.estimated_value >= 20000) return 5
          if (lead.estimated_value >= 5000) return 3
          return 1
        })(),
        label: 'Estimated Value',
        value: lead.estimated_value ? `₦${lead.estimated_value.toLocaleString()}` : 'Not specified'
      },
      engagement: {
        points: Math.min(10, (lead.activities?.[0]?.count || 0) * 2),
        label: 'Engagement',
        value: `${lead.activities?.[0]?.count || 0} activities`
      }
    }

    return NextResponse.json({
      score,
      breakdown,
      quality: score >= 80 ? 'Hot Lead' : score >= 60 ? 'Warm Lead' : score >= 40 ? 'Cold Lead' : 'Unqualified',
      lead
    })
  } catch (error: any) {
    console.error('Error analyzing lead score:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze lead score' },
      { status: 500 }
    )
  }
}
