import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, ArrowLeft, MapPin, Navigation, Save, Plus, X } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface Interest {
  id: string;
  interest_name: string;
  category: string;
}

interface Availability {
  default_location_lat: number | null;
  default_location_lng: number | null;
  max_travel_distance_km: number;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [availability, setAvailability] = useState<Availability>({
    default_location_lat: null,
    default_location_lng: null,
    max_travel_distance_km: 50,
  });
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    setIsLoading(true);

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
      setFullName(profileData.full_name || "");
      setUsername(profileData.username || "");
      setBio(profileData.bio || "");
    }

    // Fetch interests
    const { data: interestsData } = await supabase
      .from("user_interests")
      .select("*")
      .eq("user_id", user.id);

    setInterests(interestsData || []);

    // Fetch availability
    const { data: availabilityData } = await supabase
      .from("user_availability")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (availabilityData) {
      setAvailability({
        default_location_lat: availabilityData.default_location_lat,
        default_location_lng: availabilityData.default_location_lng,
        max_travel_distance_km: availabilityData.max_travel_distance_km || 50,
      });
      if (availabilityData.default_location_lat && availabilityData.default_location_lng) {
        setLocationInput(`${availabilityData.default_location_lat}, ${availabilityData.default_location_lng}`);
      }
    }

    setIsLoading(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    toast.loading("Getting location...", { id: "geo" });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setAvailability({
          ...availability,
          default_location_lat: lat,
          default_location_lng: lng,
        });
        setLocationInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        toast.success("Location set!", { id: "geo" });
      },
      () => {
        toast.error("Unable to get location", { id: "geo" });
      }
    );
  };

  const addInterest = async () => {
    if (!user || !newInterest.trim()) return;

    const { data, error } = await supabase
      .from("user_interests")
      .insert({
        user_id: user.id,
        interest_name: newInterest.trim(),
        category: "other",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("You already have this interest");
      } else {
        toast.error("Failed to add interest");
      }
      return;
    }

    setInterests([...interests, data]);
    setNewInterest("");
    toast.success("Interest added!");
  };

  const removeInterest = async (id: string) => {
    const { error } = await supabase
      .from("user_interests")
      .delete()
      .eq("id", id);

    if (!error) {
      setInterests(interests.filter((i) => i.id !== id));
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          username: username.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Parse location
      let lat: number | null = null;
      let lng: number | null = null;
      
      if (locationInput.trim()) {
        const parts = locationInput.split(",").map((p) => p.trim());
        if (parts.length === 2) {
          lat = parseFloat(parts[0]);
          lng = parseFloat(parts[1]);
          if (isNaN(lat) || isNaN(lng)) {
            lat = null;
            lng = null;
          }
        }
      }

      // Upsert availability
      const { error: availError } = await supabase
        .from("user_availability")
        .upsert({
          user_id: user.id,
          default_location_lat: lat,
          default_location_lng: lng,
          max_travel_distance_km: availability.max_travel_distance_km,
        });

      if (availError) throw availError;

      toast.success("Profile saved!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile");
    }

    setIsSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Your Profile</span>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="animate-slide-up space-y-6">
          {/* Profile Info */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name</label>
                <Input
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Username</label>
                <Input
                  placeholder="@username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Bio</label>
                <Input
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Settings */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                Default Location
              </CardTitle>
              <CardDescription>Your home base for calculating meetup distances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="latitude, longitude"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={getCurrentLocation}>
                  <Navigation className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Max Travel Distance: {availability.max_travel_distance_km} km
                </label>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={availability.max_travel_distance_km}
                  onChange={(e) =>
                    setAvailability({
                      ...availability,
                      max_travel_distance_km: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-lg">Your Interests</CardTitle>
              <CardDescription>These help us find people like you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add an interest..."
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addInterest()}
                />
                <Button onClick={addInterest}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span
                      key={interest.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-sm"
                    >
                      {interest.interest_name}
                      <button
                        onClick={() => removeInterest(interest.id)}
                        className="ml-1 opacity-50 hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={saveProfile}
            disabled={isSaving}
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </main>
    </div>
  );
}
