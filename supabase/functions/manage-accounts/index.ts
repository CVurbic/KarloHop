import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Role = "admin" | "radnik";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Nedostaje autorizacija." }, 401);

    // anon-scope client samo da provjerimo tko zove
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: callerData, error: callerError } = await callerClient.auth.getUser(jwt);
    if (callerError || !callerData?.user) {
      return json({ error: "Nevažeća sesija." }, 401);
    }

    // service-role client za sve stvarne operacije (admin API + zaobilazi RLS)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: isAdmin, error: roleError } = await admin.rpc("has_role", {
      _user_id: callerData.user.id,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      return json({ error: "Nemaš ovlasti za ovu radnju." }, 403);
    }

    const body = await req.json();
    const action = body.action as string;

    if (action === "list") {
      const { data: usersData, error: listError } = await admin.auth.admin.listUsers();
      if (listError) return json({ error: listError.message }, 400);

      const { data: roles, error: rolesError } = await admin
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) return json({ error: rolesError.message }, 400);

      const roleByUser = new Map<string, Role>();
      for (const r of roles ?? []) roleByUser.set(r.user_id, r.role as Role);

      const accounts = usersData.users.map((u) => ({
        id: u.id,
        email: u.email,
        role: roleByUser.get(u.id) ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }));

      return json({ accounts });
    }

    if (action === "create") {
      const { email, password, role } = body as { email: string; password: string; role: Role };
      if (!email || !password || password.length < 6 || !["admin", "radnik"].includes(role)) {
        return json({ error: "Neispravni podaci za kreiranje računa." }, 400);
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError || !created?.user) {
        return json({ error: createError?.message ?? "Greška pri kreiranju računa." }, 400);
      }

      const { error: insertRoleError } = await admin
        .from("user_roles")
        .insert({ user_id: created.user.id, role });
      if (insertRoleError) {
        return json({ error: insertRoleError.message }, 400);
      }

      return json({ id: created.user.id, email: created.user.email, role });
    }

    if (action === "updateRole") {
      const { userId, role } = body as { userId: string; role: Role };
      if (!userId || !["admin", "radnik"].includes(role)) {
        return json({ error: "Neispravni podaci za promjenu role." }, 400);
      }

      const { error: deleteError } = await admin.from("user_roles").delete().eq("user_id", userId);
      if (deleteError) return json({ error: deleteError.message }, 400);

      const { error: insertError } = await admin.from("user_roles").insert({ user_id: userId, role });
      if (insertError) return json({ error: insertError.message }, 400);

      return json({ ok: true });
    }

    if (action === "delete") {
      const { userId } = body as { userId: string };
      if (!userId) return json({ error: "Nedostaje userId." }, 400);

      if (userId === callerData.user.id) {
        return json({ error: "Ne možeš obrisati vlastiti račun." }, 400);
      }

      const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
      if (deleteError) return json({ error: deleteError.message }, 400);

      return json({ ok: true });
    }

    return json({ error: "Nepoznata akcija." }, 400);
  } catch (err) {
    console.error("manage-accounts error:", err);
    return json({ error: "Neočekivana greška." }, 500);
  }
});
