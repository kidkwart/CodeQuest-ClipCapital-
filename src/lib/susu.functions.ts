import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const joinSusuByInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ invite: z.string().trim().min(1).max(64) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: group, error: gErr } = await supabaseAdmin
      .from("susu_groups")
      .select("id, members_count")
      .eq("invite_code", data.invite)
      .maybeSingle();

    if (gErr) throw new Error(gErr.message);
    if (!group) throw new Error("Invalid invite code");

    const { data: existing, error: eErr } = await supabaseAdmin
      .from("susu_memberships")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (eErr) throw new Error(eErr.message);
    if (existing) throw new Error("Already a member");

    const newOrder = (group.members_count ?? 0) + 1;

    const { error: mErr } = await supabaseAdmin
      .from("susu_memberships")
      .insert({ group_id: group.id, user_id: userId, payout_order: newOrder });
    if (mErr) throw new Error(mErr.message);

    const { error: uErr } = await supabaseAdmin
      .from("susu_groups")
      .update({ members_count: newOrder })
      .eq("id", group.id);
    if (uErr) throw new Error(uErr.message);

    return { groupId: group.id as string };
  });
