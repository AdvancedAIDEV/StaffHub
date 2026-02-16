import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Clock, Shield, ArrowRight, CheckCircle, Zap } from "lucide-react";
import heroImage from "@assets/hero-staffing.png";

const features = [
  {
    icon: Zap,
    title: "Three Scheduling Workflows",
    description: "AutoConfirm for instant assignments, SeekReply for accept/decline offers, and Publishing for first-come shift claiming.",
  },
  {
    icon: Users,
    title: "Ready Pool",
    description: "Staff signal their availability for specific dates, making it easy to fill positions with willing workers.",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description: "Built-in clock in/out with automatic hour calculations and detailed time entry history.",
  },
  {
    icon: Calendar,
    title: "Event Management",
    description: "Create and manage events with shifts, venues, uniform requirements, and special instructions.",
  },
  {
    icon: Shield,
    title: "Performance Reviews",
    description: "Rate and review staff after events to maintain quality and track performance over time.",
  },
  {
    icon: CheckCircle,
    title: "Real-time Messaging",
    description: "Direct communication between admins and staff for coordination and updates.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold" data-testid="text-brand-name">StaffHub</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#features" className="text-sm text-muted-foreground hover-elevate px-3 py-1.5 rounded-md" data-testid="link-features">
              Features
            </a>
            <Button asChild data-testid="button-login">
              <a href="/api/login">
                Sign In
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight" data-testid="text-hero-heading">
                Smarter Event<br />
                <span className="text-primary">Staffing</span> Made Simple
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Streamline your event workforce with intelligent scheduling, real-time coordination, and powerful management tools designed for modern staffing agencies.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="/api/login">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild data-testid="button-learn-more">
                  <a href="#features">Learn More</a>
                </Button>
              </div>
              <div className="flex items-center gap-4 flex-wrap pt-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Free to get started
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  No credit card required
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-md overflow-hidden ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                <img
                  src={heroImage}
                  alt="Professional event staffing team at an elegant venue"
                  className="w-full aspect-video object-cover"
                  data-testid="img-hero"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold" data-testid="text-features-heading">Everything You Need</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              A complete platform for managing your event staffing operations from start to finish.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-elevate" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl font-serif font-bold" data-testid="text-cta-heading">Ready to Get Started?</h2>
          <p className="text-muted-foreground mt-2 mb-8">
            Join staffing agencies who trust StaffHub to manage their workforce efficiently.
          </p>
          <Button size="lg" asChild data-testid="button-cta-signup">
            <a href="/api/login">
              Start Managing Your Team
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4 flex-wrap text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>StaffHub</span>
          </div>
          <p data-testid="text-copyright">&copy; {new Date().getFullYear()} StaffHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
