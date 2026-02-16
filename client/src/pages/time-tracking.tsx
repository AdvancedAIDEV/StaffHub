import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TimeTracker } from "@/components/time-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState } from "react";
import type { TimeEntry, Shift, Event } from "@shared/schema";

type ShiftWithEvent = Shift & { event: Event };

export default function TimeTracking() {
  const { toast } = useToast();
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");

  const { data: activeEntry, isLoading: loadingActive } = useQuery<TimeEntry | null>({
    queryKey: ["/api/time/active"],
  });

  const { data: history = [], isLoading: loadingHistory } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time/history"],
  });

  const { data: myShifts = [] } = useQuery<ShiftWithEvent[]>({
    queryKey: ["/api/shifts/my"],
  });

  const confirmedShifts = myShifts.filter(s => s.status === "confirmed");

  const clockInMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      await apiRequest("POST", "/api/time/clock-in", { shiftId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time/history"] });
      toast({ title: "Clocked in successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to clock in", description: error.message, variant: "destructive" });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/time/clock-out", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time/history"] });
      toast({ title: "Clocked out successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to clock out", description: error.message, variant: "destructive" });
    },
  });

  if (loadingActive || loadingHistory) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeShift = myShifts.find(s => s.id === activeEntry?.shiftId);
  const activeShiftTitle = activeShift ? `${activeShift.event.title} - ${activeShift.role}` : "Active Shift";

  const totalMinutesWorked = history.reduce((sum, e) => sum + (e.totalMinutes || 0), 0);
  const totalHours = Math.floor(totalMinutesWorked / 60);
  const totalMins = totalMinutesWorked % 60;

  const totalEarnings = history.reduce((sum, e) => {
    const shift = myShifts.find(s => s.id === e.shiftId);
    if (shift?.payRate && e.totalMinutes) {
      return sum + (shift.payRate / 100) * (e.totalMinutes / 60);
    }
    return sum;
  }, 0);

  const getShiftForEntry = (entry: TimeEntry): ShiftWithEvent | undefined => {
    return myShifts.find(s => s.id === entry.shiftId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">Time Tracking</h1>
        <p className="text-muted-foreground mt-1">Track your work hours</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <TimeTracker
            shiftId={activeEntry?.shiftId || "none"}
            shiftTitle={activeEntry ? activeShiftTitle : "No active shift"}
            isActive={!!activeEntry}
            startTime={activeEntry ? new Date(activeEntry.clockIn) : undefined}
            onClockIn={() => {
              const shiftId = selectedShiftId || confirmedShifts[0]?.id;
              if (shiftId) {
                clockInMutation.mutate(shiftId);
              } else {
                toast({ title: "No confirmed shifts to clock into", variant: "destructive" });
              }
            }}
            onClockOut={() => clockOutMutation.mutate()}
          />

          {!activeEntry && confirmedShifts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
                  <SelectTrigger data-testid="select-shift-clockin">
                    <SelectValue placeholder="Choose a shift to clock into" />
                  </SelectTrigger>
                  <SelectContent>
                    {confirmedShifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.event.title} - {shift.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Time Logged</span>
                <span className="font-medium">{totalHours}h {totalMins}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed Entries</span>
                <span className="font-medium">{history.filter(e => e.status === "completed").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confirmed Shifts</span>
                <span className="font-medium">{confirmedShifts.length}</span>
              </div>
              {totalEarnings > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Earnings</span>
                  <span className="font-medium">${totalEarnings.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Time History</h2>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-empty-history">
              No time entries yet. Clock into a confirmed shift to start tracking.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => {
                const shift = getShiftForEntry(entry);
                return (
                  <Card key={entry.id} data-testid={`time-entry-${entry.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            {shift && (
                              <p className="text-sm font-medium">{shift.event.title} - {shift.role}</p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(entry.clockIn), "MMM d, yyyy")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(entry.clockIn), "h:mm a")}
                                {entry.clockOut && ` - ${format(new Date(entry.clockOut), "h:mm a")}`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {entry.totalMinutes
                                ? `${Math.floor(entry.totalMinutes / 60)}h ${entry.totalMinutes % 60}m`
                                : "In progress"}
                            </p>
                            {shift?.payRate && entry.totalMinutes && (
                              <p className="text-xs text-muted-foreground flex items-center justify-end gap-0.5">
                                <DollarSign className="h-3 w-3" />
                                {((shift.payRate / 100) * (entry.totalMinutes / 60)).toFixed(2)}
                              </p>
                            )}
                          </div>
                          <Badge variant={entry.status === "completed" ? "default" : "secondary"}>
                            {entry.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
