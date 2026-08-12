import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endpoint, payload } = await req.json()
    
    // Validate endpoint
    const allowedEndpoints = ['detect', 'compare', 'search', 'faceset/addface'];
    if (!allowedEndpoints.includes(endpoint)) {
      throw new Error('Invalid endpoint');
    }

    const FACEPP_API_KEY = Deno.env.get('FACEPP_API_KEY')
    const FACEPP_API_SECRET = Deno.env.get('FACEPP_API_SECRET')

    if (!FACEPP_API_KEY || !FACEPP_API_SECRET) {
      throw new Error('Face++ credentials not configured')
    }

    // Construct form data for Face++ API
    const formData = new FormData();
    formData.append('api_key', FACEPP_API_KEY);
    formData.append('api_secret', FACEPP_API_SECRET);
    
    // Append all payload fields
    Object.keys(payload).forEach(key => {
      formData.append(key, payload[key]);
    });

    const faceppUrl = `https://api-us.faceplusplus.com/facepp/v3/${endpoint}`;

    const response = await fetch(faceppUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
