import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, ShoppingBag, Sparkles, LogOut, User, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const meetupTypes = [
    {
      id: "friends",
      title: "Friends Meetup",
      description: "Find the perfect middle ground for you and your friends",
      icon: Users,
      color: "primary",
      gradient: "gradient-warm",
      href: "/meetup/friends",
    },
    {
      id: "marketplace",
      title: "Marketplace Meetup",
      description: "Safe public spots for buying/selling items",
      icon: ShoppingBag,
      color: "accent",
      gradient: "gradient-cool",
      href: "/meetup/marketplace",
    },
    {
      id: "interest",
      title: "Interest Matching",
      description: "Connect with people who share your passions",
      icon: Sparkles,
      color: "primary",
      gradient: "gradient-sunset",
      href: "/meetup/interests",
    },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MeetPoint</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">
            Hey, {user.user_metadata?.full_name?.split(" ")[0] || "there"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Ready to meet up? Choose how you want to connect today.
          </p>
        </div>

        {/* Meetup Type Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {meetupTypes.map((type, index) => (
            <Card
              key={type.id}
              variant="interactive"
              className="overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(type.href)}
            >
              <div className={`h-2 ${type.gradient}`} />
              <CardHeader>
                <div className={`w-14 h-14 rounded-2xl ${type.gradient} flex items-center justify-center mb-4`}>
                  <type.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">{type.title}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Meetup
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card variant="glass" className="p-4">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground">Upcoming Meetups</p>
          </Card>
          <Card variant="glass" className="p-4">
            <p className="text-2xl font-bold text-accent">0</p>
            <p className="text-sm text-muted-foreground">Friends</p>
          </Card>
          <Card variant="glass" className="p-4">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground">Interests</p>
          </Card>
          <Card variant="glass" className="p-4">
            <p className="text-2xl font-bold text-accent">0</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card variant="default">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest meetups and connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No meetups yet</p>
              <Button variant="hero" onClick={() => navigate("/meetup/friends")}>
                Plan Your First Meetup
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
