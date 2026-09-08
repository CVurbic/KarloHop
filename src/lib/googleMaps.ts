// ponytail: module-level singleton promise so the script tag is injected once, no loader dependency needed
let loadPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const script = document.createElement("script");
    // language=hr osigurava da recenzije i tekstovi stižu na hrvatskom bez obzira na jezik uređaja
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=hr&region=HR`;
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
