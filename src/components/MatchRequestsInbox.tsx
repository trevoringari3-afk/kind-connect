import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Inbox, User, Check, X, Loader2, MapPin, RefreshCw } from "lucide-react";

interface MatchRequest {
  id: string;
  user1_id: string;
  created_at: string;
  sender_profile?: {
    display_name: string;
    age: number;
    location: string | null;
    bio: string | null;
    interests: string[] | null;
  };
}

interface MatchRequestsInboxProps {
  currentUserId: string;
  onRequestHandled?: () => void;
}

export const MatchRequestsInbox = ({ currentUserId, onRequestHandled }: MatchRequestsInboxProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    
    // Set up real-time subscription for new requests
    const channel = supabase
      .channel(`inbox-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `user2_id=eq.${currentUserId}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchRequests = async () => {
    try {
      // Get pending match requests where current user is the recipient
      const { data: matchesData, error } = await supabase
        .from("matches")
        .select("id, user1_id, created_at")
        .eq("user2_id", currentUserId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!matchesData || matchesData.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Fetch sender profiles
      const senderIds = matchesData.map((m) => m.user1_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, age, location, bio, interests")
        .in("user_id", senderIds);

      const requestsWithProfiles = matchesData.map((match) => ({
        ...match,
        sender_profile: profiles?.find((p) => p.user_id === match.user1_id),
      }));

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error("Error fetching match requests:", error);
      toast({
        title: "Error",
        description: "Failed to load match requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (matchId: string, accept: boolean) => {
    setProcessingId(matchId);

    try {
      const newStatus = accept ? "accepted" : "declined";
      
      const { error } = await supabase
        .from("matches")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", matchId);

      if (error) throw error;

      toast({
        title: accept ? "Match Accepted! 🎉" : "Request Declined",
        description: accept
          ? "You can now message each other!"
          : "The request has been declined.",
      });

      // Remove from local state
      setRequests((prev) => prev.filter((r) => r.id !== matchId));
      onRequestHandled?.();
    } catch (error) {
      console.error("Error handling match request:", error);
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card className="shadow-medium border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <Inbox className="w-5 h-5 text-primary" />
              Match Requests
              {requests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {requests.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              People who want to connect with you
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchRequests}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No pending requests</p>
            <p className="text-sm mt-1">New requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50"
              >
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-gradient-cool text-white text-lg">
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">
                      {request.sender_profile?.display_name || "Unknown"}
                    </h3>
                    {request.sender_profile?.age && (
                      <span className="text-sm text-muted-foreground">
                        {request.sender_profile.age}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTimeAgo(request.created_at)}
                    </span>
                  </div>

                  {request.sender_profile?.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" />
                      {request.sender_profile.location}
                    </p>
                  )}

                  {request.sender_profile?.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {request.sender_profile.bio}
                    </p>
                  )}

                  {request.sender_profile?.interests &&
                    request.sender_profile.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {request.sender_profile.interests.slice(0, 3).map((interest) => (
                          <Badge
                            key={interest}
                            variant="secondary"
                            className="text-xs"
                          >
                            {interest}
                          </Badge>
                        ))}
                        {request.sender_profile.interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{request.sender_profile.interests.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRequest(request.id, true)}
                      disabled={processingId === request.id}
                      className="bg-gradient-warm hover:opacity-90"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequest(request.id, false)}
                      disabled={processingId === request.id}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
