import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const contactData: ContactEmailRequest = await req.json();
    console.log("Received contact data:", contactData);

    // Send email to business
    const businessEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <onboarding@resend.dev>",
      to: ["info@hophop-napuhanci.com"],
      subject: `Nova poruka sa web stranice od ${contactData.name}`,
      html: `
        <h1>Nova poruka sa kontakt forme!</h1>
        <h2>Detalji pošiljatelja:</h2>
        <p><strong>Ime:</strong> ${contactData.name}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        
        <h2>Poruka:</h2>
        <p>${contactData.message.replace(/\n/g, '<br>')}</p>
        
        <h2>Kontakt informacije:</h2>
        <p>Molimo odgovorite na ${contactData.email}</p>
      `,
    });

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <onboarding@resend.dev>",
      to: [contactData.email],
      subject: "Primili smo vašu poruku - Hop Hop Napuhanci",
      html: `
        <h1>Hvala vam na poruci!</h1>
        <p>Poštovani/a ${contactData.name},</p>
        <p>Primili smo vašu poruku i odgovorit ćemo vam u najkraćem mogućem roku.</p>
        
        <h2>Vaša poruka:</h2>
        <p>${contactData.message.replace(/\n/g, '<br>')}</p>
        
        <p>Hvala vam što ste nas kontaktirali!</p>
        
        <p>S poštovanjem,<br>Hop Hop Napuhanci tim<br>095 865 5213<br>info@hophop-napuhanci.com</p>
      `,
    });

    console.log("Business email sent:", businessEmailResponse);
    console.log("Customer email sent:", customerEmailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      businessEmail: businessEmailResponse, 
      customerEmail: customerEmailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);