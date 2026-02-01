import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimitByIp, rateLimitErrorResponse } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { validateDocumentFile, generateSafeFilename } from '@/lib/file-validation'
import { loggers } from '@/lib/logger'

// POST /api/job-applications - Submit a job application
export async function POST(request: NextRequest) {
  try {
    // Check CSRF token
    const csrfError = await csrfProtection(request)
    if (csrfError) {
      return csrfError
    }

    // Check rate limit (3 applications per day per IP)
    const { rateLimit } = await checkRateLimitByIp({
      limit: 3,
      window: 24 * 60 * 60 * 1000 // 24 hours
    });
    if (!rateLimit.success) {
      return rateLimitErrorResponse(rateLimit);
    }

    const supabase = await createClient()
    const formData = await request.formData()

    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const experience = formData.get('experience') as string
    const coverLetter = formData.get('coverLetter') as string
    const jobPositionId = formData.get('jobPositionId') as string
    const resume = formData.get('resume') as File | null

    // Validate required fields
    if (!fullName || !email || !phone || !jobPositionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if job position exists and is active
    const { data: position } = await supabase
      .from('job_positions')
      .select('id')
      .eq('id', jobPositionId)
      .eq('is_active', true)
      .single()

    if (!position) {
      return NextResponse.json(
        { error: 'Invalid job position' },
        { status: 404 }
      )
    }

    let resumeUrl: string | null = null
    let resumeFileName: string | null = null

    // Handle resume upload
    if (resume && resume.size > 0) {
      // SECURITY: Validate file with magic number verification (PDF only, Word uses basic MIME check)
      const validation = await validateDocumentFile(resume, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        strictMimeType: true,
      })

      if (!validation.valid) {
        loggers.api.warn('Resume upload validation failed', {
          error: validation.error,
          fileName: resume.name,
          mimeType: resume.type,
          jobPositionId,
        })
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      // SECURITY: Generate safe filename - prevents path traversal and uses validated extension
      const sanitizedJobId = jobPositionId.replace(/[^a-zA-Z0-9-_]/g, '')
      const fileName = generateSafeFilename(`resume-${sanitizedJobId}`, validation.detectedType!)
      const filePath = `${sanitizedJobId}/${fileName}`

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resume)

      if (uploadError) {
        loggers.api.error('Resume upload failed', uploadError, {
          filePath,
          jobPositionId,
        })
        return NextResponse.json(
          { error: 'Failed to upload resume' },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath)

      resumeUrl = urlData.publicUrl
      resumeFileName = resume.name
    }

    // Insert application into database
    const { data: application, error: dbError } = await supabase
      .from('job_applications')
      .insert({
        job_position_id: jobPositionId,
        full_name: fullName,
        email: email,
        phone: phone,
        experience: experience || null,
        cover_letter: coverLetter || null,
        resume_url: resumeUrl,
        resume_file_name: resumeFileName,
        status: 'pending',
      })
      .select()
      .single()

    if (dbError || !application) {
      loggers.database.error('Job application insert failed', dbError, {
        jobPositionId,
        email,
      })
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    loggers.api.info('Job application submitted', {
      applicationId: application.id,
      jobPositionId,
      email,
    })

    return NextResponse.json({
      success: true,
      application,
      message: 'Application submitted successfully'
    }, { status: 201 })

  } catch (error) {
    loggers.api.error('Unexpected error in job application', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
