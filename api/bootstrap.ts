import { createClient } from '@supabase/supabase-js';

const TABLE_NAME = 'app_bootstrap_snapshots';
const SNAPSHOT_KEY = process.env.SUPABASE_BOOTSTRAP_KEY || 'production';

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return res.status(204).end();
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('payload, updated_at')
    .eq('key', SNAPSHOT_KEY)
    .maybeSingle();

  if (error) {
    console.error('Failed to read Supabase bootstrap snapshot', error);
    return res.status(500).json({ error: 'Failed to load bootstrap snapshot' });
  }

  if (!data) {
    return res.status(204).end();
  }

  return res.status(200).json({
    snapshot: data.payload,
    updatedAt: data.updated_at,
  });
}
