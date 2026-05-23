import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "cabal-storage";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Storage not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

export function storageConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function storagePut(
  key: string,
  data: Buffer | Uint8Array,
  contentType: string
): Promise<{ key: string; url: string }> {
  const client = getClient();
  const { error } = await client.storage
    .from(BUCKET)
    .upload(key, data, { contentType, upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data: pub } = client.storage.from(BUCKET).getPublicUrl(key);
  return { key, url: pub.publicUrl };
}

// Compost — unseen. Used by decay to remove files belonging to expired artifacts.
export async function storageDelete(keys: string[]): Promise<void> {
  const filtered = keys.filter(Boolean);
  if (filtered.length === 0) return;
  if (!storageConfigured()) return;
  const client = getClient();
  const { error } = await client.storage.from(BUCKET).remove(filtered);
  if (error) console.warn(`[storage] delete failed: ${error.message}`);
}
