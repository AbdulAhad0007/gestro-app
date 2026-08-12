import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { face_token } = await req.json()
    if (!face_token) {
      throw new Error('face_token is required')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Query public.user_profiles using service role to bypass RLS
    const { data: profiles, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('face_id', face_token)
      
    if (error) throw error

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found for this face' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }
    
    const matchingUser = profiles[0];

    // Mint a custom JWT for Supabase session
    const secretStr = Deno.env.get('JWT_SECRET') ?? '';
    const secret = new TextEncoder().encode(secretStr);
    
    const jwt = await new jose.SignJWT({
        aud: 'authenticated',
        role: 'authenticated',
        email: matchingUser.email,
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { full_name: matchingUser.name, face_token: matchingUser.face_id },
        session_id: crypto.randomUUID()
    })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setSubject(matchingUser.id)
    .setExpirationTime('7d')
    .sign(secret);

    const userPayload = {
      id: matchingUser.id,
      email: matchingUser.email,
      user_metadata: {
        full_name: matchingUser.name,
        face_token: matchingUser.face_id
      },
      created_at: matchingUser.created_at
    };

    return new Response(JSON.stringify({ 
      user: userPayload, 
      profile: matchingUser,
      session: {
        access_token: jwt,
        refresh_token: jwt,
        expires_in: 604800,
        token_type: 'bearer',
        user: userPayload
      }
    }), {
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
