import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import DOMPurify from "https://esm.sh/isomorphic-dompurify@2.16.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Rate limiting: Track requests by IP
const rateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

// Validation schema
const bookingSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(100, "Name too long"),
  surname: z.string().trim().min(1, "Surname required").max(100, "Surname too long"),
  email: z.string().trim().email("Invalid email").max(255, "Email too long"),
  phone: z.string().trim().min(1, "Phone required").max(50, "Phone too long"),
  booking_start_date: z.string().trim().min(1, "Start date required"),
  booking_end_date: z.string().optional().default(""),
  selected_bounce_house: z.string().trim().min(1, "Selection required").max(200),
  delivery_address: z.string().trim().min(1, "Address required").max(500, "Address too long"),
  additional_notes: z.string().optional().default(""),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  name: string;
  surname: string;
  email: string;
  phone: string;
  booking_start_date: string;
  booking_end_date: string;
  selected_bounce_house: string;
  delivery_address: string;
  additional_notes: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const now = Date.now();
    const requests = rateLimit.get(clientIP) || [];
    const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // Update rate limit tracker
    recentRequests.push(now);
    rateLimit.set(clientIP, recentRequests);
    
    // Clean up old entries periodically
    if (rateLimit.size > 1000) {
      for (const [ip, times] of rateLimit.entries()) {
        const validTimes = times.filter(time => now - time < RATE_LIMIT_WINDOW);
        if (validTimes.length === 0) {
          rateLimit.delete(ip);
        }
      }
    }

    const bookingData: BookingEmailRequest = await req.json();
    
    // Validate input
    const validatedData = bookingSchema.parse(bookingData);
    console.log("Booking request received from IP:", clientIP);

    // Sanitize all user inputs
    const sanitizedData = {
      name: DOMPurify.sanitize(validatedData.name),
      surname: DOMPurify.sanitize(validatedData.surname),
      email: DOMPurify.sanitize(validatedData.email),
      phone: DOMPurify.sanitize(validatedData.phone),
      selected_bounce_house: DOMPurify.sanitize(validatedData.selected_bounce_house),
      booking_start_date: DOMPurify.sanitize(validatedData.booking_start_date),
      booking_end_date: validatedData.booking_end_date ? DOMPurify.sanitize(validatedData.booking_end_date) : '',
      delivery_address: DOMPurify.sanitize(validatedData.delivery_address),
      additional_notes: validatedData.additional_notes ? DOMPurify.sanitize(validatedData.additional_notes) : '',
    };

    // Send email to business
    const businessEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <onboarding@resend.dev>",
      to: ["tiktokarlo2021@gmail.com", "turic.karlo@gmail.com"],
      subject: `Nova rezervacija - ${sanitizedData.selected_bounce_house}`,
      html: `
        <h1>Nova rezervacija napuhanca!</h1>
        <h2>Detalji rezervacije:</h2>
        <p><strong>Ime i prezime:</strong> ${sanitizedData.name} ${sanitizedData.surname}</p>
        <p><strong>Email:</strong> ${sanitizedData.email}</p>
        <p><strong>Telefon:</strong> ${sanitizedData.phone}</p>
        <p><strong>Napuhanac:</strong> ${sanitizedData.selected_bounce_house}</p>
        <p><strong>Datum od:</strong> ${sanitizedData.booking_start_date}</p>
        <p><strong>Datum do:</strong> ${sanitizedData.booking_end_date}</p>
        <p><strong>Adresa dostave:</strong> ${sanitizedData.delivery_address}</p>
        ${sanitizedData.additional_notes ? `<p><strong>Dodatne napomene:</strong> ${sanitizedData.additional_notes}</p>` : ''}
        
        <h2>Kontakt informacije:</h2>
        <p>Molimo kontaktirajte klijenta na ${sanitizedData.phone} ili ${sanitizedData.email}</p>
      `,
    });

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <onboarding@resend.dev>",
      to: [sanitizedData.email],
      subject: `Potvrda rezervacije - ${sanitizedData.selected_bounce_house}`,
      html: `
        <h1>Hvala vam na rezervaciji!</h1>
        <p>Poštovani/a ${sanitizedData.name},</p>
        <p>Primili smo vašu rezervaciju za napuhanac <strong>${sanitizedData.selected_bounce_house}</strong>.</p>
        
        <h2>Detalji vaše rezervacije:</h2>
        <p><strong>Datum od:</strong> ${sanitizedData.booking_start_date}</p>
        <p><strong>Datum do:</strong> ${sanitizedData.booking_end_date}</p>
        <p><strong>Adresa dostave:</strong> ${sanitizedData.delivery_address}</p>
        ${sanitizedData.additional_notes ? `<p><strong>Vaše napomene:</strong> ${sanitizedData.additional_notes}</p>` : ''}
        
        <p>Kontaktirat ćemo vas uskoro radi potvrde termina i dogovora oko dostave.</p>
        <p>Hvala vam što ste odabrali Hop Hop Napuhance!</p>
        
        <p>S poštovanjem,<br>Hop Hop Napuhanci tim<br>095 865 5213<br>info@hophop-napuhanci.com</p>
      `,
    });

    console.log("Booking emails sent successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Booking confirmation emails sent"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      console.error("Validation error:", error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data",
          details: error.errors 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    console.error("Error in send-booking-email function:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to process booking request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);