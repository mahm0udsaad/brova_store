/**
 * Seed Admin User Script
 * 
 * This script creates the admin user in Supabase Auth and adds them to the admins table.
 * Run this once to set up the initial admin user.
 * 
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const ADMIN_EMAIL = '101mahm0udsaad@gmail.com'
const ADMIN_PASSWORD = 'Nn011@25'

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local')
    const envContent = readFileSync(envPath, 'utf-8')
    const lines = envContent.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join('=')
        }
      }
    }
  } catch (error) {
    console.error('⚠️  Could not load .env.local file')
  }
}

loadEnv()

async function seedAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
    process.exit(1)
  }

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🌱 Seeding admin user...')
  console.log(`   Email: ${ADMIN_EMAIL}`)

  try {
    // Step 1: Create the user in Supabase Auth
    console.log('\n📝 Creating user in Supabase Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        console.log('⚠️  User already exists in auth. Fetching user...')
        
        // Get existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError
        
        const existingUser = users.find(u => u.email === ADMIN_EMAIL)
        if (!existingUser) {
          throw new Error('User exists but could not be found')
        }
        
        console.log(`✓ Found existing user: ${existingUser.id}`)
        
        // Update password if needed
        console.log('🔐 Updating password...')
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password: ADMIN_PASSWORD }
        )
        if (updateError) throw updateError
        console.log('✓ Password updated')
        
        // Step 2: Update profile with admin flag
        console.log('\n📋 Updating profile...')
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: existingUser.id,
            is_admin: true,
            full_name: 'Admin',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          console.error('⚠️  Warning: Could not update profile:', profileError)
        } else {
          console.log('✓ Profile updated')
        }

        console.log('\n✅ Admin user seeded successfully!')
        console.log(`\n📧 Email: ${ADMIN_EMAIL}`)
        console.log(`🔑 Password: ${ADMIN_PASSWORD}`)
        console.log(`\n🔗 Login at: /admin-login`)
        
        return
      }
      
      throw authError
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user returned')
    }

    console.log(`✓ User created: ${authData.user.id}`)

    // Step 2: Create/update profile with admin flag
    console.log('\n📋 Creating profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        is_admin: true,
        full_name: 'Admin',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('⚠️  Warning: Could not create profile:', profileError)
    } else {
      console.log('✓ Profile created')
    }

    console.log('\n✅ Admin user seeded successfully!')
    console.log(`\n📧 Email: ${ADMIN_EMAIL}`)
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`)
    console.log(`\n🔗 Login at: /admin-login`)

  } catch (error) {
    console.error('\n❌ Error seeding admin:', error)
    process.exit(1)
  }
}

// Run the seed function
seedAdmin()
