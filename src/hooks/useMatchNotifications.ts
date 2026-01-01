import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MatchNotificationsOptions {
  userId: string | null;
  enabled?: boolean;
}

export const useMatchNotifications = ({ userId, enabled = true }: MatchNotificationsOptions) => {
  const { toast } = useToast();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId || !enabled) return;

    // Subscribe to new match requests where current user is user2_id (the recipient)
    const channel = supabase
      .channel(`match-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `user2_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("New match request received:", payload);

          const newMatch = payload.new as {
            id: string;
            user1_id: string;
            status: string;
          };

          // Only notify for pending requests
          if (newMatch.status !== "pending") return;

          // Fetch the sender's profile
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", newMatch.user1_id)
            .maybeSingle();

          const senderName = senderProfile?.display_name || "Someone";

          toast({
            title: "New Match Request! 💕",
            description: `${senderName} wants to connect with you.`,
            duration: 5000,
          });
        }
      )
      .subscribe((status) => {
        console.log("Match notification subscription status:", status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled, toast]);
};
