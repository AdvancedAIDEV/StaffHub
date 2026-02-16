import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Play, Square } from "lucide-react";
import { format } from "date-fns";

interface TimeTrackerProps {
  shiftId: string;
  shiftTitle: string;
  isActive?: boolean;
  startTime?: Date;
  onClockIn?: () => void;
  onClockOut?: () => void;
}

export function TimeTracker({
  shiftId,
  shiftTitle,
  isActive = false,
  startTime,
  onClockIn,
  onClockOut,
}: TimeTrackerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isActive && startTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsed(diff);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card data-testid={`time-tracker-${shiftId}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Shift</p>
          <p className="font-semibold" data-testid="text-shift-title">{shiftTitle}</p>
        </div>
        
        {isActive && (
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Time Elapsed</p>
            <p className="text-3xl font-mono font-bold" data-testid="text-elapsed-time">
              {formatTime(elapsed)}
            </p>
            {startTime && (
              <p className="text-xs text-muted-foreground mt-2">
                Started at {format(startTime, "h:mm a")}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {!isActive ? (
            <Button
              className="w-full"
              size="lg"
              onClick={onClockIn}
              data-testid="button-clock-in"
            >
              <Play className="h-5 w-5 mr-2" />
              Clock In
            </Button>
          ) : (
            <Button
              className="w-full"
              variant="destructive"
              size="lg"
              onClick={onClockOut}
              data-testid="button-clock-out"
            >
              <Square className="h-5 w-5 mr-2" />
              Clock Out
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
