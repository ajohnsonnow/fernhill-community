import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This endpoint creates a new user via Supabase Admin API
// The admin API requires the service role key, which is only safe server-side
export async function POST(request: Request) {
  try {
    const { email, tribeName, status } = await request.json()

    // Validate input
    if (!email || !tribeName) {
      return NextResponse.json(
        { error: 'Email and tribe name are required' },
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
        { error: 'Only admins can create users' },
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

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Create the auth user - this will trigger handle_new_user() 
    // which automatically creates the profile
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        tribe_name: tribeName,
        full_name: tribeName // Use tribe name as default full name
      }
    })

    if (createError) {
      console.error('Error creating user:', {
        message: createError.message,
        status: createError.status,
        code: createError.code,
        details: createError
      })
      return NextResponse.json(
        { error: `Failed to create user: ${createError.message}` },
        { status: 500 }
      )
    }

    // Update the profile with additional fields
    // The trigger created basic profile, now we add admin-specified data
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        tribe_name: tribeName,
        status: status || 'pending',
        vouched_by_name: 'Admin (manual add)'
      })
      .eq('id', newUser.user.id)

    if (updateError) {
      console.error('Error updating profile:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError,
        user_id: newUser.user.id
      })
      // User was created but profile update failed - not critical
    }

    // Log the action
    await supabaseAdmin.from('audit_logs').insert({
      admin_id: currentUser.id,
      action: 'user_created',
      details: {
        new_user_id: newUser.user.id,
        email: email.toLowerCase(),
        tribe_name: tribeName,
        status
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        tribe_name: tribeName
      },
      message: `${tribeName} has been added! They can now sign in with their email.`
    })

  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}
