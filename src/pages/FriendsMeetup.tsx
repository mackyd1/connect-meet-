import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Users, ArrowLeft, Search, Loader2 } from "lucide-react";
import AddressInput from "@/components/AddressInput";
import MeetupMap from "@/components/MeetupMap";
import PlaceCard from "@/components/PlaceCard";
import { usePlacesSearch, Place } from "@/hooks/usePlacesSearch";

const PLACE_TYPES = [
  { id: "coffee", name: "Coffee Shop", description: "Casual hangout spot" },
  { id: "restaurant", name: "Restaurant", description: "Grab a meal together" },
  { id: "library", name: "Library", description: "Quiet study session" },
  { id: "mall", name: "Shopping Mall", description: "Shop and hang out" },
];

interface LocationData {
  id: string;
  name: string;
  address: string;
  coords: { lat: number; lng: number } | null;
}

export default function FriendsMeetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<string>("coffee");
  
  // Location state
  const [locations, setLocations] = useState<LocationData[]>([
    { id: "1", name: "You", address: "", coords: null },
    { id: "2", name: "Friend 1", address: "", coords: null },
  ]);
  
  // Places state
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [midpoint, setMidpoint] = useState<{ lat: number; lng: number } | null>(null);
  
  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const { searchPlaces, isLoading: isSearching } = usePlacesSearch();

  const addLocation = () => {
    const newId = String(Date.now());
    setLocations([
      ...locations,
      { id: newId, name: `Friend ${locations.length}`, address: "", coords: null },
    ]);
  };

  const removeLocation = (id: string) => {
    if (locations.length <= 2) {
      toast.error("You need at least 2 locations");
      return;
    }
    setLocations(locations.filter((loc) => loc.id !== id));
    // Reset places if we remove a location
    setPlaces([]);
    setSelectedPlace(null);
    setMidpoint(null);
  };

  const updateLocationName = (id: string, name: string) => {
    setLocations(locations.map((loc) => 
      loc.id === id ? { ...loc, name } : loc
    ));
  };

  const updateLocationAddress = (id: string, address: string) => {
    setLocations(locations.map((loc) => 
      loc.id === id ? { ...loc, address } : loc
    ));
  };

  const updateLocationCoords = (id: string, coords: { lat: number; lng: number }, displayName: string) => {
    setLocations(locations.map((loc) => 
      loc.id === id ? { ...loc, coords, address: displayName } : loc
    ));
  };

  const calculateMidpoint = (
    locs: { lat: number; lng: number }[]
  ): { lat: number; lng: number } => {
    let x = 0, y = 0, z = 0;
    locs.forEach(({ lat, lng }) => {
      const latRad = (lat * Math.PI) / 180;
      const lngRad = (lng * Math.PI) / 180;
      x += Math.cos(latRad) * Math.cos(lngRad);
      y += Math.cos(latRad) * Math.sin(lngRad);
      z += Math.sin(latRad);
    });

    x /= locs.length;
    y /= locs.length;
    z /= locs.length;

    const lngMid = Math.atan2(y, x);
    const hyp = Math.sqrt(x * x + y * y);
    const latMid = Math.atan2(z, hyp);

    return {
      lat: (latMid * 180) / Math.PI,
      lng: (lngMid * 180) / Math.PI,
    };
  };

  const handleFindPlaces = async () => {
    const validLocations = locations.filter((loc) => loc.coords !== null);
    
    if (validLocations.length < 2) {
      toast.error("Please enter and search at least 2 addresses");
      return;
    }

    const coords = validLocations.map((loc) => loc.coords!);
    const mid = calculateMidpoint(coords);
    setMidpoint(mid);

    const foundPlaces = await searchPlaces(mid.lat, mid.lng, selectedType, 10000);
    setPlaces(foundPlaces);
    
    if (foundPlaces.length > 0) {
      toast.success(`Found ${foundPlaces.length} places nearby!`);
    } else {
      toast.error("No places found. Try a different place type.");
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
      toast.error("Please enter a meetup title");
      return;
    }

    if (!selectedPlace) {
      toast.error("Please select a meeting spot");
      return;
    }

    setIsSaving(true);

    try {
      const { data: meetup, error: meetupError } = await supabase
        .from("meetups")
        .insert({
          creator_id: user.id,
          title: title.trim(),
          description: `Meeting at ${selectedPlace.name}${selectedPlace.address ? ` - ${selectedPlace.address}` : ''}`,
          meetup_type: "friends" as const,
          meeting_point_lat: selectedPlace.lat,
          meeting_point_lng: selectedPlace.lng,
          meeting_point_name: selectedPlace.name,
          status: "pending",
        })
        .select()
        .single();

      if (meetupError) throw meetupError;

      // Add creator as participant
      const yourLocation = locations[0];
      if (yourLocation.coords) {
        await supabase.from("meetup_participants").insert({
          meetup_id: meetup.id,
          user_id: user.id,
          location_lat: yourLocation.coords.lat,
          location_lng: yourLocation.coords.lng,
          status: "accepted",
        });
      }

      toast.success("Meetup created! Share the details with your friends.");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save meetup");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmedCount = locations.filter((loc) => loc.coords !== null).length;
  const canSearch = confirmedCount >= 2;
  
  // Calculate center for map
  const validCoords = locations.filter((loc) => loc.coords).map((loc) => loc.coords!);
  const defaultCenter = midpoint || (validCoords.length > 0 ? validCoords[0] : { lat: 40.7128, lng: -74.006 });

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Friends Meetup</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="animate-slide-up space-y-6">
            {/* Title Input */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-lg">Meetup Details</CardTitle>
                <CardDescription>Give your meetup a name</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="e.g., Weekend Coffee Catch-up"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Place Type Selection */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-lg">What kind of place?</CardTitle>
                <CardDescription>Choose where you'd like to meet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {PLACE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedType === type.id
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <p className="font-semibold text-sm">{type.name}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Locations */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-lg">Everyone's Locations</CardTitle>
                <CardDescription>
                  Enter addresses and click search to find them ({confirmedCount}/{locations.length} confirmed)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {locations.map((location, index) => (
                  <div
                    key={location.id}
                    className="p-4 rounded-xl bg-muted/50 animate-fade-in space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-warm flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground font-bold text-xs">
                          {index + 1}
                        </span>
                      </div>
                      <Input
                        placeholder="Name (e.g., John)"
                        value={location.name}
                        onChange={(e) => updateLocationName(location.id, e.target.value)}
                        className="font-medium flex-1"
                      />
                      {locations.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLocation(location.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <AddressInput
                      label=""
                      placeholder="Enter address..."
                      value={location.address}
                      onChange={(address) => updateLocationAddress(location.id, address)}
                      onLocationFound={(coords, displayName) => 
                        updateLocationCoords(location.id, coords, displayName)
                      }
                      showGpsButton={index === 0}
                      isConfirmed={!!location.coords}
                    />
                  </div>
                ))}

                <Button variant="outline" onClick={addLocation} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Person
                </Button>
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
                    : "Enter at least 2 addresses to see suggested spots"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <MeetupMap
                  center={defaultCenter}
                  places={places}
                  selectedPlace={selectedPlace}
                  onPlaceSelect={handlePlaceSelect}
                  userLocation={locations[0]?.coords}
                  otherLocation={locations[1]?.coords}
                  className="h-[400px] lg:h-[500px]"
                />
              </CardContent>
            </Card>

            {/* Selected Place Details */}
            {selectedPlace && (
              <Card variant="feature" className="animate-scale-in">
                <div className="h-2 gradient-warm" />
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
