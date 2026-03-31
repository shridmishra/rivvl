/**
 * Parse property address from listing URL slug.
 */
export function parseAddressFromUrl(url: string): {
  street: string;
  city: string;
  state: string;
  zip?: string;
} | null {
  try {
    const pathname = new URL(url).pathname;

    // Redfin: /STATE/CITY/STREET-ADDRESS-ZIP/unit-X/home/ID
    // or /STATE/CITY/STREET-ADDRESS-ZIP/home/ID
    const redfinMatch = pathname.match(
      /^\/([A-Z]{2})\/([^/]+)\/([^/]+?)(?:\/unit-[^/]+)?\/home\/\d+/i
    );
    if (redfinMatch) {
      const state = redfinMatch[1].toUpperCase();
      const city = redfinMatch[2].replace(/-/g, " ");
      const streetPart = redfinMatch[3];
      // The last segment may contain a ZIP code (5 digits at the end)
      const zipMatch = streetPart.match(/-(\d{5})$/);
      const zip = zipMatch ? zipMatch[1] : undefined;
      const street = (zipMatch ? streetPart.slice(0, -6) : streetPart).replace(/-/g, " ");
      return { street, city, state, zip };
    }

    // Zillow: /homedetails/STREET-ADDRESS-CITY-STATE-ZIP/ZPID/
    const zillowMatch = pathname.match(/\/homedetails\/([^/]+)\/(\d+_zpid)/i);
    if (zillowMatch) {
      const slug = zillowMatch[1];
      // Try to parse: street-city-state-zip pattern
      const parts = slug.split("-");
      if (parts.length < 4) return null;
      // Last part is usually ZIP (5 digits)
      const lastPart = parts[parts.length - 1];
      const hasZip = /^\d{5}$/.test(lastPart);
      const zip = hasZip ? lastPart : undefined;
      // State is 2-letter code before ZIP
      const stateIdx = hasZip ? parts.length - 2 : parts.length - 1;
      const statePart = parts[stateIdx];
      if (!/^[A-Z]{2}$/i.test(statePart)) return null;
      const state = statePart.toUpperCase();
      // City is typically 1-2 words before state
      // This is a best-effort heuristic
      const cityIdx = stateIdx - 1;
      if (cityIdx < 1) return null;
      // Assume city is 1-3 words before state
      const cityParts: string[] = [];
      for (let i = cityIdx; i >= Math.max(1, cityIdx - 2); i--) {
        // If it looks like a number (street number) stop
        if (/^\d+$/.test(parts[i])) break;
        cityParts.unshift(parts[i]);
      }
      const city = cityParts.join(" ");
      const streetEnd = cityIdx - cityParts.length + 1;
      const street = parts.slice(0, streetEnd).join(" ");
      if (!street || !city) return null;
      return { street, city, state, zip };
    }

    // Realtor: /realestateandhomes-detail/STREET_CITY_STATE_ZIP
    const realtorMatch = pathname.match(/\/realestateandhomes-detail\/([^/]+)/i);
    if (realtorMatch) {
      const slug = realtorMatch[1];
      const parts = slug.split("_");
      if (parts.length < 3) return null;
      const street = parts[0].replace(/-/g, " ");
      const city = parts[1].replace(/-/g, " ");
      const state = parts[2].toUpperCase();
      const zip = parts[3] && /^\d{5}/.test(parts[3]) ? parts[3].slice(0, 5) : undefined;
      return { street, city, state, zip };
    }
  } catch {
    // Invalid URL
  }
  return null;
}
