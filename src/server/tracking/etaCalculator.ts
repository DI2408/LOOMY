import { distanceKm } from "./locationEta";

export type LatLng = { lat: number; lng: number };

export type ETACalculatorOptions = {
  /** Extra minutes for parking, stairs, etc. Default 2.5. */
  bufferMinutes?: number;
  /** Google Maps API key (server only). */
  apiKey?: string;
};

const DEFAULT_BUFFER_MIN = 2.5;
const GOOGLE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json";

/**
 * ETA from Google Distance Matrix `duration_in_traffic` (driving) + buffer.
 * Falls back to haversine + assumed speed if the API fails or key is missing.
 */
export class ETACalculator {
  private readonly bufferMinutes: number;
  private readonly apiKey: string | undefined;

  constructor(options: ETACalculatorOptions = {}) {
    this.bufferMinutes = options.bufferMinutes ?? DEFAULT_BUFFER_MIN;
    this.apiKey = options.apiKey ?? process.env.GOOGLE_MAPS_API_KEY;
  }

  /**
   * Returns a Danish phrase, e.g. "Ankommer om ca. 8 minutter".
   */
  async getEtaPhrase(
    courierLocation: LatLng,
    customerLocation: LatLng
  ): Promise<string> {
    const totalMin = await this.getTotalMinutes(
      courierLocation,
      customerLocation
    );
    const rounded = Math.max(1, Math.round(totalMin));
    return `Ankommer om ca. ${rounded} minutter`;
  }

  /** Total ETA minutes including buffer (for UI that needs a number). */
  async getTotalMinutes(
    courierLocation: LatLng,
    customerLocation: LatLng
  ): Promise<number> {
    const trafficMin = await this.fetchDurationInTrafficMinutes(
      courierLocation,
      customerLocation
    );
    return trafficMin + this.bufferMinutes;
  }

  private async fetchDurationInTrafficMinutes(
    origin: LatLng,
    dest: LatLng
  ): Promise<number> {
    if (!this.apiKey) {
      return this.fallbackDurationMinutes(origin, dest);
    }

    const params = new URLSearchParams({
      origins: `${origin.lat},${origin.lng}`,
      destinations: `${dest.lat},${dest.lng}`,
      mode: "driving",
      departure_time: "now",
      traffic_model: "best_guess",
      key: this.apiKey,
    });

    const url = `${GOOGLE_MATRIX_URL}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      return this.fallbackDurationMinutes(origin, dest);
    }

    const data = (await res.json()) as {
      status?: string;
      rows?: Array<{
        elements?: Array<{
          status?: string;
          duration_in_traffic?: { value: number };
          duration?: { value: number };
        }>;
      }>;
    };

    if (data.status !== "OK") {
      return this.fallbackDurationMinutes(origin, dest);
    }

    const el = data.rows?.[0]?.elements?.[0];
    if (!el || el.status !== "OK") {
      return this.fallbackDurationMinutes(origin, dest);
    }

    const seconds =
      el.duration_in_traffic?.value ?? el.duration?.value ?? null;
    if (seconds == null || !Number.isFinite(seconds)) {
      return this.fallbackDurationMinutes(origin, dest);
    }

    return Math.max(0.5, seconds / 60);
  }

  /** ~22 km/h average when Google is unavailable. */
  private fallbackDurationMinutes(origin: LatLng, dest: LatLng): number {
    const km = distanceKm(origin, dest);
    const hours = km / 22;
    return Math.max(0.5, hours * 60);
  }
}

let singleton: ETACalculator | null = null;

export function getETACalculator(): ETACalculator {
  if (!singleton) {
    singleton = new ETACalculator();
  }
  return singleton;
}
