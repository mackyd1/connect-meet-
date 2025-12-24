import { useState, useCallback } from 'react';

export interface Place {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address?: string;
  distance?: number;
}

interface UsePlacesSearchReturn {
  searchPlaces: (lat: number, lng: number, type: string, radius?: number) => Promise<Place[]>;
  isLoading: boolean;
  error: string | null;
}

// Overpass API for OpenStreetMap POI search
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

// Map our types to OSM tags
const TYPE_TO_OSM_TAGS: Record<string, string> = {
  police: '["amenity"="police"]',
  coffee: '["amenity"="cafe"]',
  mall: '["shop"="mall"]',
  bank: '["amenity"="bank"]',
  library: '["amenity"="library"]',
  restaurant: '["amenity"="restaurant"]',
  fastfood: '["amenity"="fast_food"]',
};

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function usePlacesSearch(): UsePlacesSearchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = useCallback(async (
    lat: number,
    lng: number,
    type: string,
    radius: number = 5000 // 5km default
  ): Promise<Place[]> => {
    setIsLoading(true);
    setError(null);

    const osmTag = TYPE_TO_OSM_TAGS[type] || '["amenity"="cafe"]';

    const query = `
      [out:json][timeout:25];
      (
        node${osmTag}(around:${radius},${lat},${lng});
        way${osmTag}(around:${radius},${lat},${lng});
      );
      out body center;
    `;

    try {
      const response = await fetch(OVERPASS_API_URL, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search for places');
      }

      const data = await response.json();

      const places: Place[] = data.elements
        .filter((el: any) => el.tags?.name)
        .map((el: any) => {
          const placeLat = el.lat || el.center?.lat;
          const placeLng = el.lon || el.center?.lon;
          
          return {
            id: String(el.id),
            name: el.tags.name,
            type: el.tags.amenity || el.tags.shop || type,
            lat: placeLat,
            lng: placeLng,
            address: [
              el.tags['addr:street'],
              el.tags['addr:housenumber'],
              el.tags['addr:city'],
            ].filter(Boolean).join(', ') || undefined,
            distance: calculateDistance(lat, lng, placeLat, placeLng),
          };
        })
        .sort((a: Place, b: Place) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 10); // Limit to 10 results

      if (places.length === 0) {
        setError(`No ${type} found nearby. Try a different location type.`);
      }

      return places;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { searchPlaces, isLoading, error };
}
