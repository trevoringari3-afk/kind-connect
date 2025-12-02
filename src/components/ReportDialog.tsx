import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName: string;
}

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spam or scam" },
  { value: "fake", label: "Fake profile" },
  { value: "threatening", label: "Threatening behavior" },
  { value: "other", label: "Other" },
];

export const ReportDialog = ({
  open,
  onOpenChange,
  reportedUserId,
  reportedUserName,
}: ReportDialogProps) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Please select a reason",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      reason,
      description: description.trim() || null,
    });

    if (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe.",
      });
      onOpenChange(false);
      setReason("");
      setDescription("");
    }

    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {reportedUserName}</DialogTitle>
          <DialogDescription>
            Help us understand what happened. Your report will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>What's the issue?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
