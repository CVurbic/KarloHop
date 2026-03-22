import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingPayload {
  id: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  delivery_address: string | null;
  booking_start_date: string;
  selected_bounce_house: string | null;
  additional_notes: string | null;
  price: number | null;
  status: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Parse booking data - supports both direct call and webhook payload
    let booking: BookingPayload;
    const body = await req.json();

    if (body.record) {
      // Database webhook format
      booking = body.record as BookingPayload;
    } else {
      // Direct call format
      booking = body as BookingPayload;
    }

    if (!booking.id || !booking.booking_start_date) {
      return new Response(
        JSON.stringify({ error: "Missing booking id or date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get stored tokens
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["google_refresh_token", "google_access_token", "google_token_expires"]);

    if (!settings || settings.length === 0) {
      console.log("Google Calendar not connected, skipping sync");
      return new Response(
        JSON.stringify({ skipped: true, reason: "not_connected" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenMap: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => {
      tokenMap[s.key] = s.value;
    });

    const refreshToken = tokenMap["google_refresh_token"];
    if (!refreshToken) {
      console.log("No refresh token found, skipping sync");
      return new Response(
        JSON.stringify({ skipped: true, reason: "no_refresh_token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get a valid access token (refresh if expired)
    let accessToken = tokenMap["google_access_token"];
    const expiresAt = tokenMap["google_token_expires"];

    if (!accessToken || !expiresAt || new Date(expiresAt) <= new Date()) {
      // Refresh the access token
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshResponse.ok) {
        const err = await refreshResponse.text();
        console.error("Token refresh failed:", err);
        return new Response(
          JSON.stringify({ error: "token_refresh_failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newTokens = await refreshResponse.json();
      accessToken = newTokens.access_token;
      const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

      // Update stored tokens
      await supabase.from("settings").upsert({ key: "google_access_token", value: accessToken }, { onConflict: "key" });
      await supabase.from("settings").upsert({ key: "google_token_expires", value: newExpiry }, { onConflict: "key" });
    }

    // Build Google Calendar event
    const bounceName = booking.selected_bounce_house || "Napuhanac";
    const dateStr = booking.booking_start_date.split("T")[0]; // ensure YYYY-MM-DD

    const descriptionParts: string[] = [];
    if (booking.phone) descriptionParts.push(`Telefon: ${booking.phone}`);
    if (booking.email) descriptionParts.push(`Email: ${booking.email}`);
    if (booking.price != null) descriptionParts.push(`Cijena: ${booking.price} \u20ac`);
    if (booking.additional_notes) descriptionParts.push(`Napomene: ${booking.additional_notes}`);
    descriptionParts.push(`Status: ${booking.status}`);

    const event = {
      summary: `\u{1F3F0} ${booking.name} ${booking.surname} - ${bounceName}`,
      location: booking.delivery_address || undefined,
      description: descriptionParts.join("\n"),
      start: {
        dateTime: `${dateStr}T09:00:00`,
        timeZone: "Europe/Zagreb",
      },
      end: {
        dateTime: `${dateStr}T13:00:00`,
        timeZone: "Europe/Zagreb",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "popup", minutes: 1440 }, // 24h before
        ],
      },
    };

    // Create event in Google Calendar
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!calendarResponse.ok) {
      const err = await calendarResponse.text();
      console.error("Calendar API error:", err);
      return new Response(
        JSON.stringify({ error: "calendar_api_failed", details: err }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdEvent = await calendarResponse.json();

    // Store the Google Calendar event ID back on the booking
    await supabase
      .from("bookings")
      .update({ google_calendar_event_id: createdEvent.id })
      .eq("id", booking.id);

    console.log(`Calendar event created for booking ${booking.id}: ${createdEvent.id}`);

    return new Response(
      JSON.stringify({ success: true, eventId: createdEvent.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
