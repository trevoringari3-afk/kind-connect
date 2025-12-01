import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

export const MessageCoach = () => {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [coaching, setCoaching] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCoaching = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message to get coaching on.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setCoaching(null);

    try {
      const { data, error } = await supabase.functions.invoke('message-coach', {
        body: { 
          message: message.trim(),
          context: context.trim() || undefined
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setCoaching(data.coaching);
      
      toast({
        title: "Coaching received",
        description: "Review the suggestions below to improve your message.",
      });
    } catch (error: any) {
      console.error('Error getting coaching:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get coaching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-medium border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle className="font-display">AI Message Coach</CardTitle>
        </div>
        <CardDescription>
          Get personalized suggestions to improve your messages while staying authentic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="context">Match Context (Optional)</Label>
          <Textarea
            id="context"
            placeholder="e.g., Shared interests in hiking and photography..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="min-h-[60px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Your Draft Message</Label>
          <Textarea
            id="message"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <Button 
          onClick={getCoaching} 
          disabled={isLoading || !message.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting coaching...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Get Coaching
            </>
          )}
        </Button>

        {coaching && (
          <div className="mt-6 p-4 rounded-lg bg-muted space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Coaching Suggestions
            </h4>
            <div className="prose prose-sm max-w-none text-foreground">
              <p className="whitespace-pre-wrap">{coaching}</p>
            </div>
          </div>
        )}

        {coaching && (
          <p className="text-xs text-muted-foreground text-center">
            Remember: These are suggestions to help you communicate better. 
            Always review and personalize before sending.
          </p>
        )}
      </CardContent>
    </Card>
  );
};