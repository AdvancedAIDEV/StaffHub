import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface ShiftCardProps {
  id: string;
  eventTitle: string;
  venue: string;
  date: Date;
  startTime: string;
  endTime: string;
  role: string;
  status: "open" | "pending" | "confirmed" | "rejected" | "completed";
  payRate?: number;
  assignmentType: "autoconfirm" | "seekreply" | "publishing";
  onAccept?: () => void;
  onReject?: () => void;
  onViewDetails?: () => void;
}

const statusColors = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function ShiftCard({
  id,
  eventTitle,
  venue,
  date,
  startTime,
  endTime,
  role,
  status,
  payRate,
  assignmentType,
  onAccept,
  onReject,
  onViewDetails,
}: ShiftCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-shift-${id}`}>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-base leading-tight" data-testid={`text-shift-title-${id}`}>{eventTitle}</h3>
            <p className="text-sm text-muted-foreground mt-1">{role}</p>
          </div>
          <Badge className={statusColors[status]} data-testid={`badge-shift-status-${id}`}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{venue}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>{format(date, "MMM d, yyyy")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>{startTime} - {endTime}</span>
        </div>
        {payRate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span>${(payRate / 100).toFixed(2)}/hour</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {status === "pending" && assignmentType === "seekreply" && (
          <>
            <Button 
              variant="default" 
              className="flex-1" 
              onClick={onAccept}
              data-testid={`button-accept-shift-${id}`}
            >
              Accept
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={onReject}
              data-testid={`button-reject-shift-${id}`}
            >
              Decline
            </Button>
          </>
        )}
        {status === "open" && assignmentType === "publishing" && (
          <Button 
            variant="default" 
            className="w-full" 
            onClick={onAccept}
            data-testid={`button-claim-shift-${id}`}
          >
            Claim Shift
          </Button>
        )}
        {(status === "confirmed" || status === "completed") && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onViewDetails}
            data-testid={`button-view-shift-${id}`}
          >
            View Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
