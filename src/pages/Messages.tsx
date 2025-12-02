import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConversationList } from "@/components/ConversationList";
import { ChatWindow } from "@/components/ChatWindow";
import { ArrowLeft, MessageCircle } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Messages = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedMatchName, setSelectedMatchName] = useState<string>("");
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSelectMatch = async (matchId: string) => {
    setSelectedMatchId(matchId);

    // Fetch the other user's name
    if (user) {
      const { data: match } = await supabase
        .from("matches")
        .select("user1_id, user2_id")
        .eq("id", matchId)
        .single();

      if (match) {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", otherUserId)
          .single();

        setSelectedMatchName(profile?.display_name || "Unknown User");
      }
    }
  };

  const handleBack = () => {
    setSelectedMatchId(null);
  };

  if (!user) return null;

  const showConversationList = !isMobileView || !selectedMatchId;
  const showChatWindow = !isMobileView || selectedMatchId;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-display font-bold bg-gradient-warm bg-clip-text text-transparent">
            Messages
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6">
        <Card className="h-[calc(100vh-140px)] overflow-hidden">
          <div className="flex h-full">
            {/* Conversation List */}
            {showConversationList && (
              <div className={`${isMobileView ? "w-full" : "w-80 border-r border-border"}`}>
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold">Conversations</h2>
                </div>
                <ConversationList
                  currentUserId={user.id}
                  selectedMatchId={selectedMatchId}
                  onSelectMatch={handleSelectMatch}
                />
              </div>
            )}

            {/* Chat Window */}
            {showChatWindow && (
              <div className="flex-1 flex flex-col">
                {selectedMatchId ? (
                  <>
                    {isMobileView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="self-start m-2"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    )}
                    <ChatWindow
                      matchId={selectedMatchId}
                      currentUserId={user.id}
                      otherUserName={selectedMatchName}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg">Select a conversation</p>
                    <p className="text-sm">Choose from your matches to start chatting</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Messages;
