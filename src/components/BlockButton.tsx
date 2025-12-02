import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Ban } from "lucide-react";

interface BlockButtonProps {
  blockedUserId: string;
  blockedUserName: string;
  onBlocked?: () => void;
}

export const BlockButton = ({
  blockedUserId,
  blockedUserName,
  onBlocked,
}: BlockButtonProps) => {
  const [blocking, setBlocking] = useState(false);
  const { toast } = useToast();

  const handleBlock = async () => {
    setBlocking(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      setBlocking(false);
      return;
    }

    const { error } = await supabase.from("blocks").insert({
      blocker_id: user.id,
      blocked_id: blockedUserId,
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already blocked",
          description: `${blockedUserName} is already blocked.`,
        });
      } else {
        console.error("Error blocking user:", error);
        toast({
          title: "Error",
          description: "Failed to block user. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "User blocked",
        description: `${blockedUserName} has been blocked. They won't be able to contact you.`,
      });
      onBlocked?.();
    }

    setBlocking(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Ban className="h-4 w-4 mr-2" />
          Block
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block {blockedUserName}?</AlertDialogTitle>
          <AlertDialogDescription>
            They won't be able to message you or see your profile. You can unblock them later from your settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleBlock} disabled={blocking}>
            {blocking ? "Blocking..." : "Block User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
