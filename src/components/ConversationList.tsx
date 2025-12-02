import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  other_user?: {
    display_name: string;
    user_id: string;
  };
}

interface ConversationListProps {
  currentUserId: string;
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
}

export const ConversationList = ({
  currentUserId,
  selectedMatchId,
  onSelectMatch,
}: ConversationListProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, [currentUserId]);

  const fetchMatches = async () => {
    const { data: matchesData, error } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "accepted")
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

    if (error) {
      console.error("Error fetching matches:", error);
      setLoading(false);
      return;
    }

    // Fetch profiles for the other users
    const otherUserIds = matchesData.map((m) =>
      m.user1_id === currentUserId ? m.user2_id : m.user1_id
    );

    if (otherUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", otherUserIds);

      const matchesWithProfiles = matchesData.map((match) => {
        const otherUserId =
          match.user1_id === currentUserId ? match.user2_id : match.user1_id;
        const profile = profiles?.find((p) => p.user_id === otherUserId);
        return {
          ...match,
          other_user: profile,
        };
      });

      setMatches(matchesWithProfiles);
    } else {
      setMatches([]);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading conversations...
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No conversations yet.</p>
        <p className="text-sm mt-2">Match with someone to start chatting!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {matches.map((match) => (
          <button
            key={match.id}
            onClick={() => onSelectMatch(match.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
              selectedMatchId === match.id
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-muted"
            )}
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-warm text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {match.other_user?.display_name || "Unknown User"}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                Tap to view conversation
              </p>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};
