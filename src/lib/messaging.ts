import { supabase } from "@/integrations/supabase/client";

/**
 * Sıralı (user1_id < user2_id) sohbet kimliği bulur veya yoksa oluşturur.
 * RLS bu işleme izin verir çünkü `me` her iki taraftan da en az biridir.
 */
export const getOrCreateConversation = async (me: string, other: string) => {
  if (me === other) throw new Error("cannot message yourself");
  const [u1, u2] = me < other ? [me, other] : [other, me];

  const { data: existing, error: selErr } = await supabase
    .from("conversations")
    .select("id")
    .eq("user1_id", u1)
    .eq("user2_id", u2)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing.id;

  const { data: created, error: insErr } = await supabase
    .from("conversations")
    .insert({ user1_id: u1, user2_id: u2 })
    .select("id")
    .single();
  if (insErr) throw insErr;
  return created.id;
};
