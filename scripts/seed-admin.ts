import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function seedAdmin() {
  console.log('🌿 Fernhill Tribe - Admin Seed Script\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials in .env.local')
    console.log('Required variables:')
    console.log('  - NEXT_PUBLIC_SUPABASE_URL')
    console.log('  - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const email = await question('Enter your email address: ')

  console.log('\n🔍 Searching for user...')

  // Find user by email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('❌ Error fetching users:', listError.message)
    rl.close()
    process.exit(1)
  }

  const user = users.users.find((u) => u.email === email)

  if (!user) {
    console.error(`❌ No user found with email: ${email}`)
    console.log('\n💡 Tip: Make sure you have logged in at least once before running this script.')
    rl.close()
    process.exit(1)
  }

  console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

  // Update profile to admin
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ status: 'admin' })
    .eq('id', user.id)

  if (updateError) {
    console.error('❌ Error updating profile:', updateError.message)
    rl.close()
    process.exit(1)
  }

  console.log('✨ Successfully upgraded to admin status!')
  console.log('\n🎉 You can now access the admin dashboard at /admin/gate')

  rl.close()
}

seedAdmin()
