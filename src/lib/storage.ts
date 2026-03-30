import { supabase } from "./supabaseClient";

export function getPublicAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.replace(/^\/+/, "");
  const { data } = supabase.storage.from("assets").getPublicUrl(normalizedPath);

  return data.publicUrl;
}
