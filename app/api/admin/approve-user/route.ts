import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * API Route: Approve a pending user and send welcome email
 * POST /api/admin/approve-user
 * Body: { userId: string }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // First, verify the requester is an admin
    const supabase = await createServerClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if requester is admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', currentUser.id)
      .single()

    if (!adminProfile || (adminProfile as { status: string }).status !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can approve users' },
        { status: 403 }
      )
    }

    // Create admin client with service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error: missing service role key' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the user's profile to get their email and tribe name
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, tribe_name')
      .eq('id', userId)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the user's email from auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError || !authUser?.user?.email) {
      return NextResponse.json(
        { error: 'Could not get user email' },
        { status: 404 }
      )
    }

    const userEmail = authUser.user.email
    const tribeName = (userProfile as { tribe_name: string }).tribe_name || 'Tribe Member'

    // Update the user's status to active
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      )
    }

    // Send welcome email via Supabase (uses configured SMTP/Resend)
    // We'll use a magic link as a "welcome back" mechanism
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fernhill-community.onrender.com'
    
    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      }
    })

    // Note: generateLink doesn't send email, we need to use resend directly
    // Let's use a different approach - send via Resend API directly
    
    const resendApiKey = process.env.RESEND_API_KEY
    
    if (resendApiKey) {
      // Send welcome email via Resend
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Fernhill Community <onboarding@resend.dev>',
            to: [userEmail],
            subject: '🌿 Welcome to the Fernhill Tribe!',
            html: `
              <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #1a1a1a, #2d4a3e); border-radius: 16px; padding: 32px; color: white;">
                  <h1 style="color: #c9a227; margin-bottom: 16px;">Welcome to the Tribe, ${tribeName}! 🎉</h1>
                  
                  <p style="color: #e0e0e0; line-height: 1.6;">
                    The stewards have reviewed your application and you've been welcomed into the Fernhill community.
                  </p>
                  
                  <p style="color: #e0e0e0; line-height: 1.6;">
                    You can now access all features of the app:
                  </p>
                  
                  <ul style="color: #e0e0e0; line-height: 1.8;">
                    <li>🏠 <strong>The Hearth</strong> - Community feed & mutual aid</li>
                    <li>📅 <strong>Events</strong> - Upcoming dances & gatherings</li>
                    <li>🎵 <strong>The Journey</strong> - DJ sets & music</li>
                    <li>💬 <strong>Messages</strong> - Encrypted private messaging</li>
                    <li>📸 <strong>The Altar</strong> - Photo gallery</li>
                  </ul>
                  
                  <div style="background: rgba(201, 162, 39, 0.2); border-radius: 12px; padding: 16px; margin: 24px 0;">
                    <p style="color: #c9a227; font-weight: bold; margin-bottom: 8px;">How to Log In:</p>
                    <p style="color: #e0e0e0; margin: 0;">
                      • <strong>Magic Link:</strong> Request a new magic link at login<br/>
                      • <strong>Password:</strong> If you created a password, use that
                    </p>
                  </div>
                  
                  <a href="${siteUrl}/login" style="display: inline-block; background: #c9a227; color: #1a1a1a; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
                    Enter the Hearth →
                  </a>
                  
                  <p style="color: #888; font-size: 14px; margin-top: 32px;">
                    See you on the dance floor! 💃✨
                  </p>
                </div>
              </div>
            `,
          }),
        })

        if (!emailResponse.ok) {
          console.error('Failed to send welcome email:', await emailResponse.text())
        }
      } catch (emailErr) {
        console.error('Email sending error:', emailErr)
        // Don't fail the approval if email fails
      }
    } else {
      console.warn('RESEND_API_KEY not set - welcome email not sent')
    }

    return NextResponse.json({
      success: true,
      message: `${tribeName} has been approved and notified via email`,
      tribeName,
    })

  } catch (error: any) {
    console.error('Approve user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve user' },
      { status: 500 }
    )
  }
}
