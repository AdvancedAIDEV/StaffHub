import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Users } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  id: string;
  title: string;
  venue: string;
  venueAddress?: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: "draft" | "published" | "completed" | "cancelled";
  staffCount?: number;
  requiredStaff?: number;
  onManage?: () => void;
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  published: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function EventCard({
  id,
  title,
  venue,
  venueAddress,
  date,
  startTime,
  endTime,
  status,
  staffCount = 0,
  requiredStaff = 0,
  onManage,
}: EventCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-event-${id}`}>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight" data-testid={`text-event-title-${id}`}>{title}</h3>
          <Badge className={statusColors[status]} data-testid={`badge-status-${id}`}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <div className="overflow-hidden">
            <p className="truncate font-medium text-foreground">{venue}</p>
            {venueAddress && <p className="truncate text-xs">{venueAddress}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>{format(date, "MMM d, yyyy")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>{startTime} - {endTime}</span>
        </div>
        {requiredStaff > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span data-testid={`text-staff-count-${id}`}>
              {staffCount}/{requiredStaff} staff assigned
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={onManage}
          data-testid={`button-manage-event-${id}`}
        >
          Manage Event
        </Button>
      </CardFooter>
    </Card>
  );
}
