import { Button } from "@/components/ui/button";
import { Heart, Shield, Sparkles, MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero min-h-screen flex items-center">
        {/* Subtle background orbs */}
        <div className="absolute top-20 left-[10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-[10%] w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        
        <div className="container relative z-10 px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            {/* Header text */}
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 text-primary animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Transform Your Communication</span>
              </div>
              
              <h1 className="mb-6 text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                From Ordinary to{" "}
                <span className="bg-gradient-cool bg-clip-text text-transparent">
                  Extraordinary
                </span>
              </h1>
              
              <p className="mb-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                SmartApproach helps you craft respectful, confident messages that create genuine connections.
              </p>
            </div>

            {/* Chat Bubble Metaphor Visual */}
            <div className="relative flex items-center justify-center gap-4 md:gap-8 lg:gap-16 mb-12 md:mb-16 animate-in fade-in zoom-in-95 duration-1000 delay-300">
              
              {/* Faded/Weak Bubble - Left */}
              <div className="relative group">
                <div className="relative bg-bubble-faded/40 backdrop-blur-sm rounded-3xl rounded-bl-lg p-4 md:p-6 max-w-[140px] md:max-w-[200px] shadow-soft border border-border/30">
                  <p className="text-sm md:text-base text-muted-foreground/60 font-medium">
                    hey, what's up?
                  </p>
                  {/* Subtle dull effect */}
                  <div className="absolute inset-0 rounded-3xl rounded-bl-lg bg-gradient-to-br from-muted/20 to-transparent"></div>
                </div>
                <p className="text-xs text-muted-foreground/50 text-center mt-3 font-medium">Generic</p>
              </div>

              {/* Flowing Arrow/Line */}
              <div className="relative flex items-center justify-center w-16 md:w-24 lg:w-32">
                <svg 
                  viewBox="0 0 120 40" 
                  className="w-full h-auto text-primary/60"
                  fill="none"
                >
                  {/* Animated flowing path */}
                  <path 
                    d="M10 20 Q 40 5, 60 20 Q 80 35, 110 20" 
                    stroke="url(#flowGradient)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    strokeDasharray="8 4"
                    className="animate-flow"
                  />
                  {/* Arrow head */}
                  <path 
                    d="M102 15 L 112 20 L 102 25" 
                    stroke="url(#flowGradient)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--bubble-faded))" />
                      <stop offset="50%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--bubble-glow))" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Small sparkle on arrow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Sparkles className="w-4 h-4 text-sparkle animate-sparkle" style={{ animationDelay: '0.5s' }} />
                </div>
              </div>

              {/* Glowing/Polished Bubble - Right */}
              <div className="relative group animate-float">
                {/* Outer glow effect */}
                <div className="absolute -inset-3 bg-gradient-cool rounded-3xl opacity-20 blur-xl animate-pulse-glow"></div>
                
                {/* Main bubble */}
                <div className="relative bg-gradient-to-br from-primary to-bubble-glow-light rounded-3xl rounded-br-lg p-4 md:p-6 max-w-[160px] md:max-w-[240px] shadow-glow border border-primary-foreground/20">
                  <p className="text-sm md:text-base text-primary-foreground font-medium leading-relaxed">
                    Hi Sarah! I noticed you love hiking too. What's your favorite trail?
                  </p>
                  {/* Inner shine */}
                  <div className="absolute inset-0 rounded-3xl rounded-br-lg bg-gradient-to-br from-primary-foreground/10 to-transparent"></div>
                </div>
                
                {/* Sparkles around the bubble */}
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-5 h-5 text-sparkle animate-sparkle" style={{ animationDelay: '0s' }} />
                </div>
                <div className="absolute -bottom-1 -left-3">
                  <Sparkles className="w-4 h-4 text-sparkle animate-sparkle" style={{ animationDelay: '0.8s' }} />
                </div>
                <div className="absolute top-1/2 -right-4">
                  <Sparkles className="w-3 h-3 text-sparkle animate-sparkle" style={{ animationDelay: '1.2s' }} />
                </div>
                
                <p className="text-xs text-primary text-center mt-3 font-semibold">Confident & Personal</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-xl shadow-medium hover:shadow-large transition-all bg-gradient-cool hover:opacity-90">
                <Link to="/auth">
                  Start Improving Messages
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl border-2 hover:bg-muted/50">
                <Link to="#features">See How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-background">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Built for Respectful Connection
            </h2>
            <p className="text-lg text-muted-foreground">
              Every feature designed with confidence, clarity, and authenticity in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 mb-6 rounded-xl bg-gradient-cool flex items-center justify-center text-primary-foreground">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">AI Message Coaching</h3>
              <p className="text-muted-foreground">
                Get smart suggestions to improve your messages. You stay in control—AI helps you express yourself better.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 mb-6 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Smart Matching</h3>
              <p className="text-muted-foreground">
                Connect with people who share your interests and values. Quality matches that improve over time.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 mb-6 rounded-xl bg-accent flex items-center justify-center text-accent-foreground">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Safety First</h3>
              <p className="text-muted-foreground">
                Built-in content moderation, block/report tools, and real-time safety checks on every message.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-cool opacity-5"></div>
        <div className="container relative z-10 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Start Making Better Connections Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join SmartApproach and discover how AI-powered coaching can help you communicate with confidence.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6 rounded-xl shadow-medium hover:shadow-large transition-all bg-gradient-cool hover:opacity-90">
              <Link to="/auth">Create Your Profile</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 SmartApproach. Confident connections, powered by AI.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;