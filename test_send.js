const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const toml = require('toml');

// Read config to get anon key
const configToml = readFileSync('d:/myWork/gestro-app/supabase/config.toml', 'utf-8');
const parsed = toml.parse(configToml);

const SUPABASE_URL = 'http://127.0.0.1:54321'; // Local or whatever
// We just need to check the types of send, let's just make a dummy channel.
const client = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.signature');

const channel = client.channel('test');
channel.send({
    type: 'broadcast',
    event: 'test',
    payload: "string payload"
}).then(res => console.log('Send result:', res)).catch(e => console.error('Send error:', e));
