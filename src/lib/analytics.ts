declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const trackEvent = (name: string, params?: Record<string, any>) => {
  window.gtag?.("event", name, params);
};

export const analytics = {
  trackBookingSubmission: (bounceHouse: string, date: string) => {
    trackEvent("booking_form_submit", {
      event_category: "engagement",
      bounce_house_type: bounceHouse,
      booking_date: date,
    });
  },

  trackContactSubmission: () => {
    trackEvent("contact_form_submit", {
      event_category: "engagement",
    });
  },

  trackWhatsAppClick: () => {
    trackEvent("whatsapp_click", {
      event_category: "engagement",
      outbound: true,
    });
  },

  trackPhoneClick: (location: string) => {
    trackEvent("phone_click", {
      event_category: "engagement",
      click_location: location,
    });
  },
};
