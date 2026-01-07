import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const bookingSchema = z.object({
  name: z.string().min(2).max(50),
  surname: z.string().min(2).max(50),
  email: z.string().email().max(255),
  phone: z.string().min(8).max(20),
  booking_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  selected_bounce_house: z.string().min(1).max(100),
  delivery_address: z.string().min(5).max(255),
  multiple_days: z.boolean().optional(),
  add_table_set: z.boolean().optional(),
  additional_notes: z.string().max(500).optional().nullable(),
});

type BookingEmailRequest = z.infer<typeof bookingSchema>;

// HTML escape function to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // Initialize Supabase client for rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit (5 requests per hour per IP)
    const { data: allowed, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_client_ip: clientIp,
        p_endpoint: 'send-booking-email',
        p_max_requests: 5,
        p_window_minutes: 60
      });

    if (rateLimitError) {
      console.error("Rate limit check failed");
      // Continue anyway if rate limit check fails
    } else if (!allowed) {
      console.log("Rate limit exceeded for booking request");
      return new Response(
        JSON.stringify({ error: "Previše zahtjeva. Molimo pokušajte ponovno za sat vremena." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse and validate input
    const rawData = await req.json();
    const parseResult = bookingSchema.safeParse(rawData);

    if (!parseResult.success) {
      console.log("Invalid booking data structure received");
      return new Response(
        JSON.stringify({ error: "Nevažeći podaci. Molimo provjerite unos." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const bookingData = parseResult.data;
    console.log("Processing booking for bounce house:", bookingData.selected_bounce_house);

    // Escape all user-provided content for HTML
    const safeName = escapeHtml(bookingData.name);
    const safeSurname = escapeHtml(bookingData.surname);
    const safeEmail = escapeHtml(bookingData.email);
    const safePhone = escapeHtml(bookingData.phone);
    const safeAddress = escapeHtml(bookingData.delivery_address);
    const safeBounceHouse = escapeHtml(bookingData.selected_bounce_house);
    const safeNotes = bookingData.additional_notes ? escapeHtml(bookingData.additional_notes) : '';

    // Send email to business
    const businessEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <onboarding@resend.dev>",
      to: ["tiktokarlo2021@gmail.com", "turic.karlo@gmail.com"],
      subject: `Nova rezervacija - ${safeBounceHouse}`,
      html: `
        <h1>Nova rezervacija napuhanca!</h1>
        <h2>Detalji rezervacije:</h2>
        <p><strong>Ime i prezime:</strong> ${safeName} ${safeSurname}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Telefon:</strong> ${safePhone}</p>
        <p><strong>Napuhanac:</strong> ${safeBounceHouse}</p>
        <p><strong>Datum:</strong> ${bookingData.booking_start_date}</p>
        ${bookingData.multiple_days ? '<p><strong>Napomena:</strong> Klijent treba više dana</p>' : ''}
        ${bookingData.add_table_set ? '<p><strong>Dodatno:</strong> Set stola i klupa (+15€/dan)</p>' : ''}
        <p><strong>Adresa dostave:</strong> ${safeAddress}</p>
        ${safeNotes ? `<p><strong>Dodatne napomene:</strong> ${safeNotes}</p>` : ''}
        
        <h2>Kontakt informacije:</h2>
        <p>Molimo kontaktirajte klijenta na ${safePhone} ili ${safeEmail}</p>
      `,
    });

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <onboarding@resend.dev>",
      to: [bookingData.email],
      subject: `Potvrda rezervacije - ${safeBounceHouse}`,
      html: `
        <h1>Hvala vam na rezervaciji!</h1>
        <p>Poštovani/a ${safeName},</p>
        <p>Primili smo vašu rezervaciju za napuhanac <strong>${safeBounceHouse}</strong>.</p>
        
        <h2>Detalji vaše rezervacije:</h2>
        <p><strong>Datum:</strong> ${bookingData.booking_start_date}</p>
        ${bookingData.multiple_days ? '<p>Kontaktirat ćemo vas radi dogovora oko točnog broja dana.</p>' : ''}
        ${bookingData.add_table_set ? '<p><strong>Dodatno:</strong> Set stola i klupa (+15€/dan)</p>' : ''}
        <p><strong>Adresa dostave:</strong> ${safeAddress}</p>
        ${safeNotes ? `<p><strong>Vaše napomene:</strong> ${safeNotes}</p>` : ''}
        
        <p>Kontaktirat ćemo vas uskoro radi potvrde termina i dogovora oko dostave.</p>
        <p>Hvala vam što ste odabrali Hop Hop Napuhance!</p>
        
        <p>S poštovanjem,<br>Hop Hop Napuhanci tim<br>095 865 5213<br>info@hophop-napuhanci.com</p>
      `,
    });

    // Check for email send errors without logging response details
    if (businessEmailResponse.error || customerEmailResponse.error) {
      console.error("Email send failed");
      throw new Error("Failed to send email");
    }

    console.log("Booking emails sent successfully");

    return new Response(JSON.stringify({ 
      success: true
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-email function:", error.message);
    return new Response(
      JSON.stringify({ error: "Došlo je do greške. Molimo pokušajte ponovno." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
