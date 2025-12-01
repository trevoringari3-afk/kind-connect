import { Button } from "@/components/ui/button";
import { Heart, Shield, Sparkles, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-subtle">
        <div className="absolute inset-0 bg-gradient-warm opacity-10"></div>
        
        <div className="container relative z-10 px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 text-primary animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Connection</span>
            </div>
            
            <h1 className="mb-6 text-5xl md:text-7xl font-display font-bold tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Make Every Message{" "}
              <span className="bg-gradient-warm bg-clip-text text-transparent">
                Count
              </span>
            </h1>
            
            <p className="mb-10 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              SmartApproach helps you craft respectful, personalized messages that lead to genuine connections. Safe, supportive, and built for meaningful conversations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-xl shadow-medium hover:shadow-large transition-all">
                <Link to="/auth">Get Started Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl">
                <Link to="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-background">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Built for Respectful Connection
            </h2>
            <p className="text-lg text-muted-foreground">
              Every feature designed with safety, consent, and authenticity in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 mb-6 rounded-xl bg-gradient-warm flex items-center justify-center text-white">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">AI Message Coaching</h3>
              <p className="text-muted-foreground">
                Get smart suggestions to improve your messages. You stay in control—AI helps you express yourself better.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 mb-6 rounded-xl bg-gradient-cool flex items-center justify-center text-white">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Smart Matching</h3>
              <p className="text-muted-foreground">
                Connect with people who share your interests and values. Quality matches that improve over time.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 mb-6 rounded-xl bg-primary flex items-center justify-center text-white">
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
      <section className="py-20 md:py-32 bg-gradient-subtle relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-warm opacity-5"></div>
        <div className="container relative z-10 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Start Making Better Connections Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join SmartApproach and discover how AI-powered coaching can help you build meaningful relationships.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6 rounded-xl shadow-medium hover:shadow-large transition-all">
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
              © 2025 SmartApproach. Respectful connections, powered by AI.
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
