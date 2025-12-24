import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Navigation, Check } from 'lucide-react';
import { useGeocoding } from '@/hooks/useGeocoding';
import { toast } from 'sonner';

interface AddressInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onLocationFound: (coords: { lat: number; lng: number }, displayName: string) => void;
  showGpsButton?: boolean;
  isConfirmed?: boolean;
}

export default function AddressInput({
  label,
  placeholder = 'Enter address...',
  value,
  onChange,
  onLocationFound,
  showGpsButton = false,
  isConfirmed = false,
}: AddressInputProps) {
  const { geocode, isLoading } = useGeocoding();
  const [isGettingGps, setIsGettingGps] = useState(false);

  const handleSearch = async () => {
    if (!value.trim()) {
      toast.error('Please enter an address');
      return;
    }

    const result = await geocode(value);
    if (result) {
      onLocationFound({ lat: result.lat, lng: result.lng }, result.displayName);
      onChange(result.displayName);
      toast.success('Address found!');
    } else {
      toast.error('Could not find that address. Try being more specific.');
    }
  };

  const handleGpsLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingGps(true);
    toast.loading('Getting your location...', { id: 'gps' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
          );
          const data = await response.json();
          const displayName = data.display_name || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
          
          onChange(displayName);
          onLocationFound(coords, displayName);
          toast.success('Location found!', { id: 'gps' });
        } catch {
          onChange(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
          onLocationFound(coords, `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
          toast.success('Location found!', { id: 'gps' });
        }
        
        setIsGettingGps(false);
      },
      () => {
        toast.error('Unable to get your location', { id: 'gps' });
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        {label}
        {isConfirmed && (
          <span className="text-xs text-accent flex items-center gap-1">
            <Check className="w-3 h-3" /> Confirmed
          </span>
        )}
      </label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
          disabled={isLoading || isGettingGps}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleSearch}
          disabled={isLoading || isGettingGps || !value.trim()}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
        {showGpsButton && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleGpsLocation}
            disabled={isLoading || isGettingGps}
          >
            {isGettingGps ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
