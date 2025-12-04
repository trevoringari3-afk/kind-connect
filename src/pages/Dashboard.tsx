import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut, Sparkles } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { MessageCoach } from "@/components/MessageCoach";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUser(session.user);
      fetchProfile(session.user.id);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold bg-gradient-cool bg-clip-text text-transparent">
            SmartApproach
          </h1>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate("/subscription")}
              className="relative group bg-gradient-cool hover:opacity-90 shadow-soft hover:shadow-medium transition-all duration-300 px-4 py-2"
            >
              <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
              <span className="font-medium">Upgrade</span>
              <div className="absolute inset-0 rounded-md bg-primary-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Card */}
          <Card className="shadow-medium border-border/50">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-warm flex items-center justify-center text-white">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-display">
                    Welcome back, {profile?.display_name || "there"}!
                  </CardTitle>
                  <CardDescription>
                    Your SmartApproach dashboard
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="text-xl font-semibold">{profile?.age}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-xl font-semibold">{profile?.location || "Not set"}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Interests</p>
                  <p className="text-xl font-semibold">{profile?.interests?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Message Coach */}
          <MessageCoach />

          {/* Coming Soon Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-soft hover:shadow-medium transition-all">
              <CardHeader>
                <CardTitle className="font-display">Discover Matches</CardTitle>
                <CardDescription>
                  Find compatible people based on shared interests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all">
              <CardHeader>
                <CardTitle className="font-display">Your Messages</CardTitle>
                <CardDescription>
                  Connect and chat with your matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/messages")} className="w-full">
                  View Messages
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Profile Section */}
          {profile && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="font-display">Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.bio && (
                  <div>
                    <p className="text-sm font-medium mb-1">Bio</p>
                    <p className="text-muted-foreground">{profile.bio}</p>
                  </div>
                )}
                {profile.interests && profile.interests.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest: string) => (
                        <span
                          key={interest}
                          className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
