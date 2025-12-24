import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Place } from '@/hooks/usePlacesSearch';

// Fix for default marker icons in Leaflet with bundlers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MeetupMapProps {
  center: { lat: number; lng: number };
  places?: Place[];
  selectedPlace?: Place | null;
  onPlaceSelect?: (place: Place) => void;
  userLocation?: { lat: number; lng: number } | null;
  otherLocation?: { lat: number; lng: number } | null;
  className?: string;
}

export default function MeetupMap({
  center,
  places = [],
  selectedPlace,
  onPlaceSelect,
  userLocation,
  otherLocation,
  className = '',
}: MeetupMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current).setView([center.lat, center.lng], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update center when it changes
  useEffect(() => {
    if (map.current) {
      map.current.setView([center.lat, center.lng], 13);
    }
  }, [center.lat, center.lng]);

  // Add location markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add user location marker (blue)
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map.current)
        .bindPopup('Your location');
      markersRef.current.push(marker);
    }

    // Add other person's location marker (orange)
    if (otherLocation) {
      const otherIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #f97316; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const marker = L.marker([otherLocation.lat, otherLocation.lng], { icon: otherIcon })
        .addTo(map.current)
        .bindPopup('Other party\'s location');
      markersRef.current.push(marker);
    }

    // Add midpoint marker (green star)
    if (userLocation && otherLocation) {
      const midpointIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px;">★</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const marker = L.marker([center.lat, center.lng], { icon: midpointIcon })
        .addTo(map.current)
        .bindPopup('Midpoint');
      markersRef.current.push(marker);
    }

    // Add place markers
    places.forEach(place => {
      const isSelected = selectedPlace?.id === place.id;
      const placeIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${isSelected ? '#8b5cf6' : '#6b7280'}; width: ${isSelected ? '24px' : '18px'}; height: ${isSelected ? '24px' : '18px'}; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: all 0.2s;"></div>`,
        iconSize: [isSelected ? 24 : 18, isSelected ? 24 : 18],
        iconAnchor: [isSelected ? 12 : 9, isSelected ? 12 : 9],
      });
      
      const marker = L.marker([place.lat, place.lng], { icon: placeIcon })
        .addTo(map.current!)
        .bindPopup(`<strong>${place.name}</strong>${place.address ? `<br/>${place.address}` : ''}`);
      
      if (onPlaceSelect) {
        marker.on('click', () => onPlaceSelect(place));
      }
      
      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 1) {
      const group = L.featureGroup(markersRef.current);
      map.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [places, selectedPlace, userLocation, otherLocation, onPlaceSelect, center]);

  return (
    <div className={`rounded-xl overflow-hidden border border-border ${className}`}>
      <div ref={mapContainer} className="w-full h-full min-h-[300px]" />
    </div>
  );
}
