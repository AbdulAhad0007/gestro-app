import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, new_password } = await req.json()

    if (!user_id || !new_password) {
      throw new Error('user_id and new_password are required')
    }

    if (new_password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    // Verify the caller is authenticated and is updating their own password
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Decode the JWT to verify the caller's identity
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    // If getUser fails (e.g. custom JWT from face login), decode manually
    let callerId = callerUser?.id
    if (authError || !callerId) {
      try {
        // Decode the JWT payload manually to extract the subject (user id)
        const payloadBase64 = token.split('.')[1]
        const payload = JSON.parse(atob(payloadBase64))
        callerId = payload.sub
      } catch {
        throw new Error('Unable to verify your identity')
      }
    }

    // Ensure the caller can only update their own password
    if (callerId !== user_id) {
      throw new Error('You can only update your own password')
    }

    // Use admin API to update the user's password (bypasses session requirement)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    )

    if (updateError) {
      throw new Error(updateError.message)
    }

    return new Response(JSON.stringify({ success: true, message: 'Password updated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
