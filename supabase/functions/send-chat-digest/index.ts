// send-chat-digest — daily e-mail summary of Mr. Hop conversations.
//
// Invocation: POST /functions/v1/send-chat-digest
//   Triggered by the `mr-hop-daily-digest` pg_cron job, which passes the shared
//   secret in the `x-digest-secret` header. Can also be called manually with the
//   same header for testing.
//
// Auth: custom (no JWT). The presented secret is verified against an in-DB
//   secret via public.mr_hop_verify_digest_secret(). verify_jwt is disabled.
//
// Required env vars (already configured for the other functions):
//   RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const DIGEST_FROM = "Hop Hop Napuhanci <info@hophop-napuhanci.com>";
const DIGEST_TO = ["tiktokarlo2021@gmail.com", "turic.karlo@gmail.com"];
const WINDOW_HOURS = 24;

interface TranscriptMessage {
  role: string;
  content: string;
}

interface ChatLogRow {
  conversation_id: string;
  transcript: TranscriptMessage[] | null;
  message_count: number;
  booking: Record<string, unknown> | null;
  booking_created: boolean;
  created_at: string;
  updated_at: string;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatHr(iso: string): string {
  try {
    return new Intl.DateTimeFormat("hr-HR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Zagreb",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function renderTranscript(transcript: TranscriptMessage[] | null): string {
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return `<p style="color:#888;font-style:italic;margin:4px 0;">(prazan razgovor)</p>`;
  }
  return transcript
    .map((m) => {
      const isUser = m.role === "user";
      const who = isUser ? "Korisnik" : "Mr. Hop";
      const color = isUser ? "#0ba5e8" : "#16a34a";
      return `<p style="margin:6px 0;line-height:1.45;">
        <strong style="color:${color};">${who}:</strong>
        <span style="color:#1f2937;">${escapeHtml(m.content)}</span>
      </p>`;
    })
    .join("");
}

function renderConversation(row: ChatLogRow, index: number): string {
  const bookingBadge = row.booking_created
    ? `<span style="background:#dcfce7;color:#166534;border-radius:6px;padding:2px 8px;font-size:12px;font-weight:600;">REZERVACIJA</span>`
    : "";
  const turns = Math.max(0, (row.transcript?.length ?? row.message_count) || 0);
  let bookingSummary = "";
  if (row.booking_created && row.booking) {
    const b = row.booking;
    const parts = [
      b.name && b.surname ? `${b.name} ${b.surname}` : null,
      b.phone ? `tel: ${b.phone}` : null,
      b.selected_bounce_house ? String(b.selected_bounce_house) : null,
      b.booking_start_date ? String(b.booking_start_date) : null,
    ].filter(Boolean) as string[];
    if (parts.length) {
      bookingSummary = `<p style="margin:4px 0 8px;font-size:13px;color:#166534;">↳ ${escapeHtml(parts.join(" · "))}</p>`;
    }
  }
  return `
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:14px;background:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <strong style="color:#111827;">#${index + 1} · ${formatHr(row.updated_at)}</strong>
        <span style="color:#6b7280;font-size:12px;">${turns} poruka ${bookingBadge}</span>
      </div>
      ${bookingSummary}
      ${renderTranscript(row.transcript)}
    </div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ---- Authorise via shared secret ----
    const presented = req.headers.get("x-digest-secret") ?? "";
    const { data: ok, error: authErr } = await supabase.rpc(
      "mr_hop_verify_digest_secret",
      { p_secret: presented },
    );
    if (authErr || ok !== true) {
      return json({ error: "unauthorized" }, 401);
    }

    if (!RESEND_API_KEY) {
      return json({ error: "RESEND_API_KEY not configured" }, 500);
    }

    // ---- Gather the last 24h of real (non-test) conversations ----
    const since = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from("mr_hop_chat_logs")
      .select("conversation_id, transcript, message_count, booking, booking_created, created_at, updated_at")
      .eq("is_test", false)
      .gte("updated_at", since)
      .order("updated_at", { ascending: false });

    if (error) {
      return json({ error: "query failed", detail: error.message }, 500);
    }

    const rows = (data ?? []) as ChatLogRow[];
    if (rows.length === 0) {
      return json({ sent: false, reason: "no conversations in window", count: 0 });
    }

    const bookings = rows.filter((r) => r.booking_created).length;
    const todayLabel = new Intl.DateTimeFormat("hr-HR", {
      dateStyle: "full",
      timeZone: "Europe/Zagreb",
    }).format(new Date());

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#f9fafb;padding:20px;">
        <h2 style="color:#111827;margin:0 0 4px;">Mr. Hop — dnevni sažetak razgovora</h2>
        <p style="color:#6b7280;margin:0 0 16px;font-size:14px;">${escapeHtml(todayLabel)}</p>
        <p style="color:#111827;font-size:15px;margin:0 0 18px;">
          Ukupno razgovora (zadnja 24h): <strong>${rows.length}</strong>
          &nbsp;·&nbsp; novih rezervacija: <strong>${bookings}</strong>
        </p>
        ${rows.map((r, i) => renderConversation(r, i)).join("")}
        <p style="color:#9ca3af;font-size:12px;margin-top:20px;">
          Automatska poruka iz admin sustava Hop Hop Napuhanci.
        </p>
      </div>`;

    const resend = new Resend(RESEND_API_KEY);
    const subject = `Mr. Hop sažetak: ${rows.length} razgovora${bookings ? `, ${bookings} rezervacija` : ""}`;
    const sendResult = await resend.emails.send({
      from: DIGEST_FROM,
      to: DIGEST_TO,
      subject,
      html,
    });

    return json({ sent: true, count: rows.length, bookings, id: sendResult.data?.id ?? null });
  } catch (e) {
    console.error("send-chat-digest error:", e);
    return json({ error: "internal error", detail: String(e) }, 500);
  }
});
