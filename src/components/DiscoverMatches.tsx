import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Search, User, Heart, X, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  age: number;
  location: string | null;
  bio: string | null;
  interests: string[] | null;
}

interface DiscoverMatchesProps {
  currentUserId: string;
  userLocation: string | null;
}

export const DiscoverMatches = ({ currentUserId, userLocation }: DiscoverMatchesProps) => {
  const { toast } = useToast();
  const [locationFilter, setLocationFilter] = useState(userLocation || "");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchProfiles = async () => {
    if (!locationFilter.trim()) {
      toast({
        title: "Location required",
        description: "Please enter a location to search for matches.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Get existing matches and blocks to exclude
      const [matchesRes, blocksRes] = await Promise.all([
        supabase
          .from("matches")
          .select("user1_id, user2_id")
          .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`),
        supabase
          .from("blocks")
          .select("blocked_id, blocker_id")
          .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`),
      ]);

      const excludeIds = new Set<string>([currentUserId]);
      
      // Exclude matched users
      matchesRes.data?.forEach((match) => {
        excludeIds.add(match.user1_id);
        excludeIds.add(match.user2_id);
      });

      // Exclude blocked users
      blocksRes.data?.forEach((block) => {
        excludeIds.add(block.blocked_id);
        excludeIds.add(block.blocker_id);
      });

      // Search for profiles by location (case-insensitive partial match)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, age, location, bio, interests")
        .ilike("location", `%${locationFilter.trim()}%`)
        .limit(20);

      if (error) throw error;

      // Filter out excluded users
      const filteredProfiles = (data || []).filter(
        (profile) => !excludeIds.has(profile.user_id)
      );

      setProfiles(filteredProfiles);
    } catch (error) {
      console.error("Error searching profiles:", error);
      toast({
        title: "Search failed",
        description: "Unable to search for matches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMatchRequest = async (targetUserId: string) => {
    try {
      const { error } = await supabase.from("matches").insert({
        user1_id: currentUserId,
        user2_id: targetUserId,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Request sent!",
        description: "Your match request has been sent.",
      });

      // Remove from list
      setProfiles((prev) => prev.filter((p) => p.user_id !== targetUserId));
    } catch (error) {
      console.error("Error sending match request:", error);
      toast({
        title: "Request failed",
        description: "Unable to send match request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const skipProfile = (userId: string) => {
    setProfiles((prev) => prev.filter((p) => p.user_id !== userId));
  };

  return (
    <Card className="shadow-medium border-border/50">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Discover Matches
        </CardTitle>
        <CardDescription>
          Find people near you based on location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Form */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="location" className="sr-only">
              Location
            </Label>
            <Input
              id="location"
              placeholder="Enter city or region..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchProfiles()}
              className="bg-background"
            />
          </div>
          <Button onClick={searchProfiles} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span className="ml-2 hidden sm:inline">Search</span>
          </Button>
        </div>

        {/* Results */}
        {searched && !loading && profiles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No matches found in this location.</p>
            <p className="text-sm mt-1">Try a different city or region.</p>
          </div>
        )}

        {profiles.length > 0 && (
          <div className="space-y-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-gradient-warm text-white text-lg">
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">
                      {profile.display_name}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {profile.age}
                    </span>
                  </div>

                  {profile.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" />
                      {profile.location}
                    </p>
                  )}

                  {profile.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {profile.bio}
                    </p>
                  )}

                  {profile.interests && profile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {profile.interests.slice(0, 3).map((interest) => (
                        <Badge
                          key={interest}
                          variant="secondary"
                          className="text-xs"
                        >
                          {interest}
                        </Badge>
                      ))}
                      {profile.interests.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.interests.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => sendMatchRequest(profile.user_id)}
                    className="bg-gradient-warm hover:opacity-90"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => skipProfile(profile.user_id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
