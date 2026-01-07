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
const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  message: z.string().min(10).max(1000),
});

type ContactEmailRequest = z.infer<typeof contactSchema>;

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

    // Check rate limit (10 requests per hour per IP for contact form)
    const { data: allowed, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_client_ip: clientIp,
        p_endpoint: 'send-contact-email',
        p_max_requests: 10,
        p_window_minutes: 60
      });

    if (rateLimitError) {
      console.error("Rate limit check failed");
      // Continue anyway if rate limit check fails
    } else if (!allowed) {
      console.log("Rate limit exceeded for contact request");
      return new Response(
        JSON.stringify({ error: "Previše zahtjeva. Molimo pokušajte ponovno za sat vremena." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse and validate input
    const rawData = await req.json();
    const parseResult = contactSchema.safeParse(rawData);

    if (!parseResult.success) {
      console.log("Invalid contact data structure received");
      return new Response(
        JSON.stringify({ error: "Nevažeći podaci. Molimo provjerite unos." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const contactData = parseResult.data;
    console.log("Processing contact form submission");

    // Escape all user-provided content for HTML
    const safeName = escapeHtml(contactData.name);
    const safeEmail = escapeHtml(contactData.email);
    const safeMessage = escapeHtml(contactData.message);

    // Send email to business
    const businessEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <onboarding@resend.dev>",
      to: ["info@hophop-napuhanci.com"],
      subject: `Nova poruka sa web stranice od ${safeName}`,
      html: `
        <h1>Nova poruka sa kontakt forme!</h1>
        <h2>Detalji pošiljatelja:</h2>
        <p><strong>Ime:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        
        <h2>Poruka:</h2>
        <p>${safeMessage.replace(/\n/g, '<br>')}</p>
        
        <h2>Kontakt informacije:</h2>
        <p>Molimo odgovorite na ${safeEmail}</p>
      `,
    });

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <onboarding@resend.dev>",
      to: [contactData.email],
      subject: "Primili smo vašu poruku - Hop Hop Napuhanci",
      html: `
        <h1>Hvala vam na poruci!</h1>
        <p>Poštovani/a ${safeName},</p>
        <p>Primili smo vašu poruku i odgovorit ćemo vam u najkraćem mogućem roku.</p>
        
        <h2>Vaša poruka:</h2>
        <p>${safeMessage.replace(/\n/g, '<br>')}</p>
        
        <p>Hvala vam što ste nas kontaktirali!</p>
        
        <p>S poštovanjem,<br>Hop Hop Napuhanci tim<br>095 865 5213<br>info@hophop-napuhanci.com</p>
      `,
    });

    // Check for email send errors without logging response details
    if (businessEmailResponse.error || customerEmailResponse.error) {
      console.error("Email send failed");
      throw new Error("Failed to send email");
    }

    console.log("Contact emails sent successfully");

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
    console.error("Error in send-contact-email function:", error.message);
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
