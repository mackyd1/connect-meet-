import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Plus, X, Users, MapPin, Calendar } from "lucide-react";

interface Interest {
  id: string;
  interest_name: string;
  category: string;
}

interface MatchedUser {
  user_id: string;
  profile: {
    full_name: string;
    avatar_url: string;
  } | null;
  interests: string[];
}

const INTEREST_CATEGORIES = [
  { id: "gaming", name: "Gaming", emoji: "🎮" },
  { id: "sports", name: "Sports", emoji: "⚽" },
  { id: "music", name: "Music", emoji: "🎵" },
  { id: "movies", name: "Movies", emoji: "🎬" },
  { id: "books", name: "Books", emoji: "📚" },
  { id: "food", name: "Food", emoji: "🍕" },
  { id: "travel", name: "Travel", emoji: "✈️" },
  { id: "technology", name: "Technology", emoji: "💻" },
  { id: "art", name: "Art", emoji: "🎨" },
  { id: "fitness", name: "Fitness", emoji: "💪" },
  { id: "outdoors", name: "Outdoors", emoji: "🏕️" },
  { id: "other", name: "Other", emoji: "✨" },
];

export default function InterestsMeetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myInterests, setMyInterests] = useState<Interest[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("other");
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyInterests();
    }
  }, [user]);

  const fetchMyInterests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_interests")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    setMyInterests(data || []);
  };

  const addInterest = async () => {
    if (!user) {
      toast.error("Please sign in");
      return;
    }

    if (!newInterest.trim()) {
      toast.error("Please enter an interest");
      return;
    }

    const interestName = newInterest.trim().toLowerCase();
    
    if (myInterests.some((i) => i.interest_name.toLowerCase() === interestName)) {
      toast.error("You already have this interest");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("user_interests")
      .insert({
        user_id: user.id,
        interest_name: newInterest.trim(),
        category: selectedCategory as any,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error("Failed to add interest");
    } else {
      setMyInterests([...myInterests, data]);
      setNewInterest("");
      toast.success("Interest added!");
    }

    setIsLoading(false);
  };

  const removeInterest = async (id: string) => {
    const { error } = await supabase
      .from("user_interests")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to remove interest");
      return;
    }

    setMyInterests(myInterests.filter((i) => i.id !== id));
    toast.success("Interest removed");
  };

  const findMatches = async () => {
    if (!user) return;

    if (myInterests.length === 0) {
      toast.error("Add some interests first to find matches");
      return;
    }

    setIsSearching(true);

    try {
      // Get all interests that match mine (from other users)
      const myInterestNames = myInterests.map((i) => i.interest_name.toLowerCase());

      const { data: matchingInterests, error } = await supabase
        .from("user_interests")
        .select("user_id, interest_name")
        .neq("user_id", user.id);

      if (error) throw error;

      // Group by user and count matches
      const userMatches: Record<string, string[]> = {};
      
      matchingInterests?.forEach((interest) => {
        if (myInterestNames.includes(interest.interest_name.toLowerCase())) {
          if (!userMatches[interest.user_id]) {
            userMatches[interest.user_id] = [];
          }
          userMatches[interest.user_id].push(interest.interest_name);
        }
      });

      // Get profiles for matched users
      const matchedUserIds = Object.keys(userMatches);
      
      if (matchedUserIds.length === 0) {
        toast.info("No matches found yet. Invite your friends to join!");
        setMatchedUsers([]);
        setIsSearching(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", matchedUserIds);

      const matches: MatchedUser[] = matchedUserIds.map((userId) => ({
        user_id: userId,
        profile: profiles?.find((p) => p.user_id === userId) || null,
        interests: userMatches[userId],
      }));

      // Sort by number of matching interests
      matches.sort((a, b) => b.interests.length - a.interests.length);

      setMatchedUsers(matches);
      toast.success(`Found ${matches.length} people with similar interests!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to search for matches");
    }

    setIsSearching(false);
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-sunset flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Interest Matching</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="animate-slide-up space-y-6">
          {/* Add Interest */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-lg">Your Interests</CardTitle>
              <CardDescription>Add your hobbies and passions to find like-minded people</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Selection */}
              <div className="flex flex-wrap gap-2">
                {INTEREST_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>

              {/* Add Interest Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Yugioh, Photography, Hiking..."
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addInterest()}
                />
                <Button onClick={addInterest} disabled={isLoading}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* My Interests List */}
              {myInterests.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {myInterests.map((interest) => {
                    const cat = INTEREST_CATEGORIES.find((c) => c.id === interest.category);
                    return (
                      <span
                        key={interest.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-sm group"
                      >
                        {cat?.emoji} {interest.interest_name}
                        <button
                          onClick={() => removeInterest(interest.id)}
                          className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Find Matches Button */}
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={findMatches}
            disabled={isSearching || myInterests.length === 0}
          >
            <Users className="w-5 h-5 mr-2" />
            {isSearching ? "Searching..." : "Find People Like You"}
          </Button>

          {/* Matches */}
          {matchedUsers.length > 0 && (
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Matches Found!
                </CardTitle>
                <CardDescription>People who share your interests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {matchedUsers.map((match) => (
                  <div
                    key={match.user_id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 animate-fade-in"
                  >
                    <div className="w-12 h-12 rounded-full gradient-warm flex items-center justify-center text-primary-foreground font-bold">
                      {match.profile?.full_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{match.profile?.full_name || "Anonymous User"}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.interests.slice(0, 3).map((interest) => (
                          <span key={interest} className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                            {interest}
                          </span>
                        ))}
                        {match.interests.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{match.interests.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      Plan Meetup
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {matchedUsers.length === 0 && myInterests.length > 0 && !isSearching && (
            <Card variant="glass" className="text-center py-8">
              <CardContent>
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">No matches found yet</p>
                <p className="text-sm text-muted-foreground">
                  Share MeetPoint with friends to find more matches!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
