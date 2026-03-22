import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-oauth-callback`;
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // If error from Google (user denied access)
  if (error) {
    return new Response(htmlPage("Greška", "Pristup Google Calendaru je odbijen."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Step 1: No code → redirect to Google OAuth consent screen
  if (!code) {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    return Response.redirect(authUrl.toString(), 302);
  }

  // Step 2: Exchange auth code for tokens
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error("Token exchange failed:", err);
      return new Response(htmlPage("Greška", "Neuspješna razmjena tokena s Googleom."), {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const tokens = await tokenResponse.json();

    if (!tokens.refresh_token) {
      return new Response(
        htmlPage("Greška", "Google nije vratio refresh token. Pokušajte ponovo ili uklonite pristup na myaccount.google.com/permissions pa ponovite."),
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Store tokens in settings table
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const upserts = [
      { key: "google_refresh_token", value: tokens.refresh_token },
      { key: "google_access_token", value: tokens.access_token },
      { key: "google_token_expires", value: expiresAt },
    ];

    for (const item of upserts) {
      const { error: upsertError } = await supabase
        .from("settings")
        .upsert(item, { onConflict: "key" });

      if (upsertError) {
        console.error(`Failed to store ${item.key}:`, upsertError);
        return new Response(htmlPage("Greška", "Spremanje tokena nije uspjelo."), {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }

    return new Response(
      htmlPage(
        "Uspješno povezano!",
        "Google Calendar je povezan. Sve nove rezervacije će se automatski pojaviti u vašem kalendaru. Možete zatvoriti ovu stranicu."
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    return new Response(htmlPage("Greška", "Došlo je do neočekivane greške."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
});

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Hop Hop</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
    .card { background: white; border-radius: 16px; padding: 48px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 420px; }
    h1 { color: #0ea5e9; margin-bottom: 12px; }
    p { color: #64748b; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
