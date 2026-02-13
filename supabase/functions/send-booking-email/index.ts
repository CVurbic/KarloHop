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

interface BusinessEmailData {
  safeName: string;
  safeSurname: string;
  safeEmail: string;
  safePhone: string;
  safeBounceHouse: string;
  bookingStartDate: string;
  safeAddress: string;
}

function buildBusinessEmailHtml(data: BusinessEmailData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova rezervacija</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0ba5e8,#e83a30);padding:30px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">Hop Hop Napuhanci</h1>
            <p style="color:#ffffff;opacity:0.9;margin:8px 0 0;font-size:14px;">Nova rezervacija napuhanca</p>
          </td>
        </tr>

        <!-- Alert banner -->
        <tr>
          <td style="padding:20px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff3cd;border-left:4px solid #f6a609;border-radius:4px;">
              <tr><td style="padding:12px 16px;font-size:14px;color:#856404;">
                Nova rezervacija zaprimljena! Molimo kontaktirajte klijenta.
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Booking details -->
        <tr>
          <td style="padding:24px 40px;">
            <h2 style="font-size:18px;color:#1b2a4a;margin:0 0 16px;border-bottom:2px solid #0ba5e8;padding-bottom:8px;">Detalji rezervacije</h2>
            <table width="100%" cellpadding="8" cellspacing="0" style="font-size:14px;color:#333;">
              <tr style="background-color:#f8f9fa;">
                <td style="font-weight:bold;width:40%;">Napuhanac:</td>
                <td>${data.safeBounceHouse}</td>
              </tr>
              <tr>
                <td style="font-weight:bold;">Datum:</td>
                <td>${data.bookingStartDate}</td>
              </tr>
              <tr>
                <td style="font-weight:bold;">Adresa dostave:</td>
                <td>${data.safeAddress}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Client info -->
        <tr>
          <td style="padding:0 40px 24px;">
            <h2 style="font-size:18px;color:#1b2a4a;margin:0 0 16px;border-bottom:2px solid #e83a30;padding-bottom:8px;">Podaci o klijentu</h2>
            <table width="100%" cellpadding="8" cellspacing="0" style="font-size:14px;color:#333;">
              <tr style="background-color:#f8f9fa;">
                <td style="font-weight:bold;width:40%;">Ime i prezime:</td>
                <td>${data.safeName} ${data.safeSurname}</td>
              </tr>
              <tr>
                <td style="font-weight:bold;">Email:</td>
                <td><a href="mailto:${data.safeEmail}" style="color:#0ba5e8;">${data.safeEmail}</a></td>
              </tr>
              <tr style="background-color:#f8f9fa;">
                <td style="font-weight:bold;">Telefon:</td>
                <td><a href="tel:${data.safePhone}" style="color:#0ba5e8;">${data.safePhone}</a></td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#f4f7fa;padding:20px 40px;text-align:center;font-size:12px;color:#888;">
            Automatska obavijest sustava Hop Hop Napuhanci
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

interface CustomerEmailData {
  safeName: string;
  safeBounceHouse: string;
  bookingStartDate: string;
  safeAddress: string;
}

function buildCustomerEmailHtml(data: CustomerEmailData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Potvrda rezervacije</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0ba5e8,#0bc0e8);padding:30px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;">Hop Hop Napuhanci</h1>
            <p style="color:#ffffff;opacity:0.9;margin:8px 0 0;font-size:16px;">Hvala vam na rezervaciji!</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:30px 40px 10px;">
            <p style="font-size:16px;color:#1b2a4a;margin:0;">Po\u0161tovani/a <strong>${data.safeName}</strong>,</p>
            <p style="font-size:14px;color:#555;margin:12px 0 0;line-height:1.6;">
              Primili smo va\u0161u rezervaciju i uskoro \u0107emo vas kontaktirati radi potvrde termina i dogovora oko dostave.
            </p>
          </td>
        </tr>

        <!-- Booking summary card -->
        <tr>
          <td style="padding:20px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;">
              <tr><td style="padding:20px;">
                <h2 style="font-size:16px;color:#0ba5e8;margin:0 0 16px;">Va\u0161a rezervacija</h2>
                <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#333;">
                  <tr>
                    <td style="font-weight:bold;width:40%;">Napuhanac:</td>
                    <td>${data.safeBounceHouse}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:bold;">Datum:</td>
                    <td>${data.bookingStartDate}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:bold;">Adresa dostave:</td>
                    <td>${data.safeAddress}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Next steps -->
        <tr>
          <td style="padding:0 40px 20px;">
            <h3 style="font-size:15px;color:#1b2a4a;margin:0 0 12px;">Sljede\u0107i koraci:</h3>
            <table cellpadding="0" cellspacing="0" style="font-size:14px;color:#555;">
              <tr><td style="padding:4px 0;">1. Kontaktirat \u0107emo vas telefonom radi potvrde</td></tr>
              <tr><td style="padding:4px 0;">2. Dogovorit \u0107emo to\u010Dno vrijeme dostave</td></tr>
              <tr><td style="padding:4px 0;">3. Dostavit \u0107emo i postaviti napuhanac na va\u0161u lokaciju</td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#1b2a4a;padding:24px 40px;text-align:center;">
            <p style="color:#ffffff;font-size:14px;margin:0 0 4px;font-weight:bold;">Hop Hop Napuhanci</p>
            <p style="color:#aab4c6;font-size:13px;margin:0;">095 865 5213 | info@hophop-napuhanci.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
    // Send email to business
    const businessEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <info@hophop-napuhanci.com>",
      to: ["tiktokarlo2021@gmail.com", "turic.karlo@gmail.com"],
      subject: `Nova rezervacija - ${safeBounceHouse}`,
      html: buildBusinessEmailHtml({
        safeName,
        safeSurname,
        safeEmail,
        safePhone,
        safeBounceHouse,
        bookingStartDate: bookingData.booking_start_date,
        safeAddress,
      }),
    });

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <info@hophop-napuhanci.com>",
      to: [bookingData.email],
      subject: `Potvrda rezervacije - ${safeBounceHouse}`,
      html: buildCustomerEmailHtml({
        safeName,
        safeBounceHouse,
        bookingStartDate: bookingData.booking_start_date,
        safeAddress,
      }),
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
