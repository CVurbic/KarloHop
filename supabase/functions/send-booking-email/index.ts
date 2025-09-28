import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const bookingData: BookingEmailRequest = await req.json();
    console.log("Received booking data:", bookingData);

    // Send email to business
    const businessEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <onboarding@resend.dev>",
      to: ["info@hophop-napuhanci.com"],
      subject: `Nova rezervacija - ${bookingData.selected_bounce_house}`,
      html: `
        <h1>Nova rezervacija napuhanca!</h1>
        <h2>Detalji rezervacije:</h2>
        <p><strong>Ime i prezime:</strong> ${bookingData.name} ${bookingData.surname}</p>
        <p><strong>Email:</strong> ${bookingData.email}</p>
        <p><strong>Telefon:</strong> ${bookingData.phone}</p>
        <p><strong>Napuhanac:</strong> ${bookingData.selected_bounce_house}</p>
        <p><strong>Datum od:</strong> ${bookingData.booking_start_date}</p>
        <p><strong>Datum do:</strong> ${bookingData.booking_end_date}</p>
        <p><strong>Adresa dostave:</strong> ${bookingData.delivery_address}</p>
        ${bookingData.additional_notes ? `<p><strong>Dodatne napomene:</strong> ${bookingData.additional_notes}</p>` : ''}
        
        <h2>Kontakt informacije:</h2>
        <p>Molimo kontaktirajte klijenta na ${bookingData.phone} ili ${bookingData.email}</p>
      `,
    });

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Hop Hop Napuhanci <onboarding@resend.dev>",
      to: [bookingData.email],
      subject: `Potvrda rezervacije - ${bookingData.selected_bounce_house}`,
      html: `
        <h1>Hvala vam na rezervaciji!</h1>
        <p>Poštovani/a ${bookingData.name},</p>
        <p>Primili smo vašu rezervaciju za napuhanac <strong>${bookingData.selected_bounce_house}</strong>.</p>
        
        <h2>Detalji vaše rezervacije:</h2>
        <p><strong>Datum od:</strong> ${bookingData.booking_start_date}</p>
        <p><strong>Datum do:</strong> ${bookingData.booking_end_date}</p>
        <p><strong>Adresa dostave:</strong> ${bookingData.delivery_address}</p>
        ${bookingData.additional_notes ? `<p><strong>Vaše napomene:</strong> ${bookingData.additional_notes}</p>` : ''}
        
        <p>Kontaktirat ćemo vas uskoro radi potvrde termina i dogovora oko dostave.</p>
        <p>Hvala vam što ste odabrali Hop Hop Napuhance!</p>
        
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
    console.error("Error in send-booking-email function:", error);
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