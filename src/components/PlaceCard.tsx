import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Check } from 'lucide-react';
import { Place } from '@/hooks/usePlacesSearch';

interface PlaceCardProps {
  place: Place;
  isSelected: boolean;
  onSelect: (place: Place) => void;
}

export default function PlaceCard({ place, isSelected, onSelect }: PlaceCardProps) {
  return (
    <Card
      variant={isSelected ? 'feature' : 'default'}
      className={`cursor-pointer transition-all hover:border-accent/50 ${
        isSelected ? 'border-accent ring-2 ring-accent/20' : ''
      }`}
      onClick={() => onSelect(place)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm truncate">{place.name}</h4>
              {isSelected && (
                <Badge variant="default" className="bg-accent text-accent-foreground">
                  <Check className="w-3 h-3 mr-1" />
                  Selected
                </Badge>
              )}
            </div>
            {place.address && (
              <p className="text-xs text-muted-foreground truncate mb-2">
                <MapPin className="w-3 h-3 inline mr-1" />
                {place.address}
              </p>
            )}
            {place.distance !== undefined && (
              <p className="text-xs text-muted-foreground">
                <Navigation className="w-3 h-3 inline mr-1" />
                {place.distance < 1 
                  ? `${Math.round(place.distance * 1000)}m from midpoint`
                  : `${place.distance.toFixed(1)}km from midpoint`
                }
              </p>
            )}
          </div>
          <Button
            variant={isSelected ? 'accent' : 'outline'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(place);
            }}
          >
            {isSelected ? 'Selected' : 'Select'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
