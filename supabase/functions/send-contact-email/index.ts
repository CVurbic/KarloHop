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
const contactSchema = z.object({
  name: z.string().trim().min(2, "Name too short").max(100, "Name too long").regex(/^[a-zA-ZčćžšđČĆŽŠĐ\s-]+$/, "Invalid name format"),
  email: z.string().trim().email("Invalid email").max(255, "Email too long"),
  message: z.string().trim().min(10, "Message too short").max(1000, "Message too long"),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  message: string;
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

    const contactData: ContactEmailRequest = await req.json();
    
    // Validate input
    const validatedData = contactSchema.parse(contactData);
    console.log("Contact request received from IP:", clientIP);

    // Sanitize all user inputs
    const sanitizedData = {
      name: DOMPurify.sanitize(validatedData.name),
      email: DOMPurify.sanitize(validatedData.email),
      message: DOMPurify.sanitize(validatedData.message.replace(/\n/g, '<br>')),
    };

    // Send email to business
    const businessEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <onboarding@resend.dev>",
      to: ["info@hophop-napuhanci.com"],
      subject: `Nova poruka sa web stranice od ${sanitizedData.name}`,
      html: `
        <h1>Nova poruka sa kontakt forme!</h1>
        <h2>Detalji pošiljatelja:</h2>
        <p><strong>Ime:</strong> ${sanitizedData.name}</p>
        <p><strong>Email:</strong> ${sanitizedData.email}</p>
        
        <h2>Poruka:</h2>
        <p>${sanitizedData.message}</p>
        
        <h2>Kontakt informacije:</h2>
        <p>Molimo odgovorite na ${sanitizedData.email}</p>
      `,
    });

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <onboarding@resend.dev>",
      to: [sanitizedData.email],
      subject: "Primili smo vašu poruku - Hop Hop Napuhanci",
      html: `
        <h1>Hvala vam na poruci!</h1>
        <p>Poštovani/a ${sanitizedData.name},</p>
        <p>Primili smo vašu poruku i odgovorit ćemo vam u najkraćem mogućem roku.</p>
        
        <h2>Vaša poruka:</h2>
        <p>${sanitizedData.message}</p>
        
        <p>Hvala vam što ste nas kontaktirali!</p>
        
        <p>S poštovanjem,<br>Hop Hop Napuhanci tim<br>095 865 5213<br>info@hophop-napuhanci.com</p>
      `,
    });

    console.log("Contact emails sent successfully");

    return new Response(JSON.stringify({ 
      success: true,
      message: "Contact confirmation emails sent"
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
    
    console.error("Error in send-contact-email function:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to process contact request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);