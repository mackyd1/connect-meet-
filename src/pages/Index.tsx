import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, ShoppingBag, Sparkles, ArrowRight, Check } from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: Users,
      title: "Friends Meetup",
      description: "Calculate the perfect meeting point based on everyone's location. Fair for all.",
      color: "primary",
    },
    {
      icon: ShoppingBag,
      title: "Marketplace Meetups",
      description: "Find safe, public locations for your Facebook Marketplace transactions.",
      color: "accent",
    },
    {
      icon: Sparkles,
      title: "Interest Matching",
      description: "Connect with people who share your passions. From Yugioh to yoga.",
      color: "primary",
    },
  ];

  const benefits = [
    "Smart location calculation using real distances",
    "Automatic scheduling based on availability",
    "Safe public meeting spots suggested",
    "Interest-based community matching",
    "Real-time notifications and updates",
    "Privacy-focused design",
  ];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MeetPoint</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Find your perfect meeting spot
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Meet in the{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              middle
            </span>
            , not the hassle
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you're meeting friends, doing a marketplace exchange, or finding people with shared interests — MeetPoint calculates the perfect spot for everyone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button variant="hero" size="xl">
                Start Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" size="xl">
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Three ways to meet</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Different situations, same great experience. MeetPoint adapts to how you want to connect.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              variant="feature"
              className="p-8 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`w-16 h-16 rounded-2xl ${
                  feature.color === "primary" ? "gradient-warm" : "gradient-cool"
                } flex items-center justify-center mb-6`}
              >
                <feature.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Why MeetPoint?</h2>
            <p className="text-muted-foreground mb-8">
              No more endless back-and-forth about where to meet. MeetPoint uses smart algorithms to find locations that work for everyone.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card variant="elevated" className="p-8">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -top-8 -left-8 w-16 h-16 rounded-full bg-primary/20 animate-float" />
                <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full bg-accent/20 animate-float" style={{ animationDelay: "1s" }} />
                <div className="w-32 h-32 rounded-full gradient-warm flex items-center justify-center shadow-elevated">
                  <MapPin className="w-16 h-16 text-primary-foreground" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card variant="elevated" className="overflow-hidden">
          <div className="gradient-warm p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to find your perfect meetup spot?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of people who've stopped arguing about where to meet.
            </p>
            <Link to="/auth">
              <Button variant="glass" size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Get Started for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>© MeetPoint. Made for better meetups.</p>
        </div>
      </footer>
    </div>
  );
}
