import { useState, useCallback } from 'react';

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

interface UseGeocodingReturn {
  geocode: (address: string) => Promise<GeocodingResult | null>;
  reverseGeocode: (lat: number, lng: number) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

// Nominatim API for OpenStreetMap geocoding
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export function useGeocoding(): UseGeocodingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocode = useCallback(async (address: string): Promise<GeocodingResult | null> => {
    if (!address.trim()) {
      setError('Please enter an address');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }

      const data = await response.json();

      if (data.length === 0) {
        setError('Address not found');
        return null;
      }

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geocoding failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reverse geocode');
      }

      const data = await response.json();
      return data.display_name || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reverse geocoding failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { geocode, reverseGeocode, isLoading, error };
}
