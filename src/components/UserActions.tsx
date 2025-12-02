import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Flag, Ban } from "lucide-react";
import { ReportDialog } from "./ReportDialog";
import { BlockButton } from "./BlockButton";

interface UserActionsProps {
  userId: string;
  userName: string;
  onBlocked?: () => void;
}

export const UserActions = ({ userId, userName, onBlocked }: UserActionsProps) => {
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setReportOpen(true)}>
            <Flag className="h-4 w-4 mr-2" />
            Report
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setBlockOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Ban className="h-4 w-4 mr-2" />
            Block
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        reportedUserId={userId}
        reportedUserName={userName}
      />

      {blockOpen && (
        <BlockButton
          blockedUserId={userId}
          blockedUserName={userName}
          onBlocked={() => {
            setBlockOpen(false);
            onBlocked?.();
          }}
        />
      )}
    </>
  );
};
