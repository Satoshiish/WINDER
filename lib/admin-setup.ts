import { supabase } from './supabase-client'

export async function setupAdminUser(email: string, password: string, name: string) {
  try {
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          role: 'admin'
        }
      }
    })

    if (authError) {
      console.error('Error creating admin user:', authError)
      return { success: false, message: authError.message }
    }

    if (authData.user) {
      // Update the profile to set admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Error setting admin role:', profileError)
        return { success: false, message: profileError.message }
      }

      console.log('Admin user created successfully:', email)
      return { success: true, message: 'Admin user created successfully' }
    }

    return { success: false, message: 'Failed to create admin user' }
  } catch (error) {
    console.error('Error in setupAdminUser:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

// Function to check if admin user exists and create if not
export async function ensureAdminUser() {
  const { data: existingAdmin } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'admin@weather.ph')
    .single()

  if (!existingAdmin) {
    console.log('Creating default admin user...')
    await setupAdminUser('admin@weather.ph', 'admin123', 'Weather Admin')
  }
}
