// Mirrors the public schema in the Supabase project. Kept narrow — only the
// columns we actually use from the web client.

export type AssetStatus = "clean" | "leaked";

export interface Asset {
  id: string;
  user_id: string | null;
  name: string | null;
  hash: string;
  size: number | null;
  storage_path: string | null;
  status: AssetStatus | null;
  block_number: number | null;
  scanned_at: string;
  created_at: string;
  updated_at: string;
  is_enforced: boolean | null;
  enforced_at: string | null;
  blockchain_tx: string | null;
  app_email: string | null;
}

export interface ProtectedAsset {
  id: number;
  phash: string;
  owner_id: string;
  blockchain_tx: string | null;
  created_at: string | null;
}

export interface Sighting {
  id: string;
  matched_phash: string;
  sighting_phash: string;
  similarity_score: number;
  device_hash: string | null;
  location_name: string | null;
  location_lat: number;
  location_lng: number;
  blockchain_owner_tx: string | null;
  detected_at: string | null;
}

export interface LeakLocation {
  id: string;
  user_id: string;
  asset_id: string;
  app: string;
  device: string;
  city: string;
  lat: number;
  lon: number;
  confidence: number;
  detected_at: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  is_admin: boolean | null;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Joined row used by the Vault page. Combines a ProtectedAsset (the global
 * phash registry) with its matching Asset (the per-user record) so we can
 * show name, status, etc.
 */
export interface ProtectedAssetWithMeta extends ProtectedAsset {
  asset: Pick<
    Asset,
    | "id"
    | "name"
    | "hash"
    | "size"
    | "status"
    | "is_enforced"
    | "enforced_at"
    | "scanned_at"
    | "app_email"
  > | null;
}
