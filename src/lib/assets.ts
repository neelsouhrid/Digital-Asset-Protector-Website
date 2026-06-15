import { createClientOnlyFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const uploadAsset = createClientOnlyFn(async (file: File) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Authentication required");

  const hash = await createFileHash(file);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userData.user.id}/${crypto.randomUUID()}-${safeName}`;
  const { error: storageError } = await supabase.storage.from("assets").upload(storagePath, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (storageError) throw storageError;

  const { data, error: insertError } = await supabase
    .from("assets")
    .insert({
      user_id: userData.user.id,
      name: file.name,
      size: file.size,
      status: "clean",
      hash,
      storage_path: storagePath,
      created_at: new Date().toISOString(),
      is_enforced: false,
    })
    .select("id")
    .single();

  if (insertError) {
    await supabase.storage.from("assets").remove([storagePath]);
    throw insertError;
  }

  return { id: data.id, storagePath };
});

async function createFileHash(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
