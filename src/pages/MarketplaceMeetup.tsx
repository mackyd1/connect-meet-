import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MapPin, ShoppingBag, ArrowLeft, Shield, Clock, MapPinned, Search, Loader2 } from "lucide-react";
import AddressInput from "@/components/AddressInput";
import MeetupMap from "@/components/MeetupMap";
import PlaceCard from "@/components/PlaceCard";
import { usePlacesSearch, Place } from "@/hooks/usePlacesSearch";

const SAFE_LOCATION_TYPES = [
  { id: "police", name: "Police Station", icon: Shield, description: "Safest option for high-value items" },
  { id: "coffee", name: "Coffee Shop", icon: Clock, description: "Public and casual meeting spot" },
  { id: "mall", name: "Shopping Mall", icon: ShoppingBag, description: "Lots of people and cameras" },
  { id: "bank", name: "Bank Lobby", icon: MapPinned, description: "Secure and well-lit" },
];

interface LocationData {
  address: string;
  coords: { lat: number; lng: number } | null;
}

export default function MarketplaceMeetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>("coffee");
  
  // Location state
  const [yourLocation, setYourLocation] = useState<LocationData>({ address: "", coords: null });
  const [buyerLocation, setBuyerLocation] = useState<LocationData>({ address: "", coords: null });
  
  // Places state
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [midpoint, setMidpoint] = useState<{ lat: number; lng: number } | null>(null);
  
  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const { searchPlaces, isLoading: isSearching } = usePlacesSearch();

  const calculateMidpoint = (
    loc1: { lat: number; lng: number },
    loc2: { lat: number; lng: number }
  ): { lat: number; lng: number } => {
    // Simple geographic midpoint calculation
    let x = 0, y = 0, z = 0;
    [loc1, loc2].forEach(({ lat, lng }) => {
      const latRad = (lat * Math.PI) / 180;
      const lngRad = (lng * Math.PI) / 180;
      x += Math.cos(latRad) * Math.cos(lngRad);
      y += Math.cos(latRad) * Math.sin(lngRad);
      z += Math.sin(latRad);
    });

    x /= 2; y /= 2; z /= 2;
    const lngMid = Math.atan2(y, x);
    const hyp = Math.sqrt(x * x + y * y);
    const latMid = Math.atan2(z, hyp);

    return {
      lat: (latMid * 180) / Math.PI,
      lng: (lngMid * 180) / Math.PI,
    };
  };

  const handleFindPlaces = async () => {
    if (!yourLocation.coords || !buyerLocation.coords) {
      toast.error("Please enter and search both addresses first");
      return;
    }

    if (!selectedType) {
      toast.error("Please select a meeting spot type");
      return;
    }

    const mid = calculateMidpoint(yourLocation.coords, buyerLocation.coords);
    setMidpoint(mid);

    const foundPlaces = await searchPlaces(mid.lat, mid.lng, selectedType, 10000);
    setPlaces(foundPlaces);
    
    if (foundPlaces.length > 0) {
      toast.success(`Found ${foundPlaces.length} places nearby!`);
    } else {
      toast.error("No places found. Try a different location type or check the addresses.");
    }
  };

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
  };

  const saveMeetup = async () => {
    if (!user) {
      toast.error("Please sign in to save meetups");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter what you're selling/buying");
      return;
    }

    if (!selectedPlace) {
      toast.error("Please select a meeting spot");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from("meetups").insert({
        creator_id: user.id,
        title: title.trim(),
        description: `Marketplace exchange at ${selectedPlace.name}${selectedPlace.address ? ` - ${selectedPlace.address}` : ''}`,
        meetup_type: "marketplace" as const,
        meeting_point_lat: selectedPlace.lat,
        meeting_point_lng: selectedPlace.lng,
        meeting_point_name: selectedPlace.name,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Meetup saved! Share the details with the other party.");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save meetup");
    } finally {
      setIsSaving(false);
    }
  };

  const canSearch = yourLocation.coords && buyerLocation.coords && selectedType;
  const defaultCenter = midpoint || yourLocation.coords || { lat: 40.7128, lng: -74.006 };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-cool flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Marketplace Meetup</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="animate-slide-up space-y-6">
            {/* Safety Notice */}
            <Card variant="glass" className="border-accent/30">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Safety First</p>
                  <p className="text-sm text-muted-foreground">
                    We'll find public, well-lit meeting spots between both locations. Police station lobbies are the safest choice for high-value items.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Item Details */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-lg">What are you exchanging?</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="e.g., iPhone 14 Pro, Vintage Guitar, etc."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Location Type Selection */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-lg">Preferred Meeting Spot Type</CardTitle>
                <CardDescription>Choose what kind of public location you prefer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {SAFE_LOCATION_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedType === type.id
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <type.icon className={`w-6 h-6 mb-2 ${selectedType === type.id ? "text-accent" : "text-muted-foreground"}`} />
                      <p className="font-semibold text-sm">{type.name}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-lg">Locations</CardTitle>
                <CardDescription>Enter addresses and click the search icon to find them</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AddressInput
                  label="Your Location"
                  placeholder="e.g., 123 Main St, New York, NY"
                  value={yourLocation.address}
                  onChange={(address) => setYourLocation(prev => ({ ...prev, address }))}
                  onLocationFound={(coords, displayName) => 
                    setYourLocation({ address: displayName, coords })
                  }
                  showGpsButton
                  isConfirmed={!!yourLocation.coords}
                />
                <AddressInput
                  label="Buyer/Seller Location"
                  placeholder="e.g., 456 Oak Ave, Brooklyn, NY"
                  value={buyerLocation.address}
                  onChange={(address) => setBuyerLocation(prev => ({ ...prev, address }))}
                  onLocationFound={(coords, displayName) => 
                    setBuyerLocation({ address: displayName, coords })
                  }
                  isConfirmed={!!buyerLocation.coords}
                />
              </CardContent>
            </Card>

            {/* Find Places Button */}
            <Button
              variant="accent"
              size="lg"
              className="w-full"
              onClick={handleFindPlaces}
              disabled={!canSearch || isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Find Meeting Spots
                </>
              )}
            </Button>

            {/* Place Suggestions */}
            {places.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Select a meeting spot ({places.length} found)
                </h3>
                {places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isSelected={selectedPlace?.id === place.id}
                    onSelect={handlePlaceSelect}
                  />
                ))}
              </div>
            )}

            {/* Save Button */}
            {selectedPlace && (
              <Button
                variant="default"
                size="lg"
                className="w-full animate-fade-in"
                onClick={saveMeetup}
                disabled={isSaving || !title.trim()}
              >
                {isSaving ? "Saving..." : "Confirm & Save Meetup"}
              </Button>
            )}
          </div>

          {/* Right Column - Map */}
          <div className="lg:sticky lg:top-24 h-fit space-y-4">
            <Card variant="default" className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  Map View
                </CardTitle>
                <CardDescription>
                  {midpoint 
                    ? "Showing meeting spots near the midpoint" 
                    : "Enter both addresses to see suggested spots"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <MeetupMap
                  center={defaultCenter}
                  places={places}
                  selectedPlace={selectedPlace}
                  onPlaceSelect={handlePlaceSelect}
                  userLocation={yourLocation.coords}
                  otherLocation={buyerLocation.coords}
                  className="h-[400px] lg:h-[500px]"
                />
              </CardContent>
            </Card>

            {/* Selected Place Details */}
            {selectedPlace && (
              <Card variant="feature" className="animate-scale-in">
                <div className="h-2 gradient-cool" />
                <CardHeader>
                  <CardTitle className="text-lg">Selected Meeting Spot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">{selectedPlace.name}</p>
                    {selectedPlace.address && (
                      <p className="text-sm text-muted-foreground">{selectedPlace.address}</p>
                    )}
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedPlace.lat},${selectedPlace.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      <MapPin className="w-4 h-4 mr-2" />
                      Open in Google Maps
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
