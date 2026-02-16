import { ShiftCard } from "@/components/shift-card";
import { TimeTracker } from "@/components/time-tracker";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function StaffDashboard() {
  const { toast } = useToast();

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<any[]>({
    queryKey: ["/api/shifts/my"],
  });

  const { data: activeTimeEntry } = useQuery<any>({
    queryKey: ["/api/time/active"],
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      await apiRequest("PATCH", `/api/shifts/${id}/respond`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts/my"] });
      toast({ title: "Shift response submitted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to respond", description: error.message, variant: "destructive" });
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      await apiRequest("POST", "/api/time/clock-in", { shiftId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/active"] });
      toast({ title: "Clocked in successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to clock in", description: error.message, variant: "destructive" });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/time/clock-out");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts/my"] });
      toast({ title: "Clocked out successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to clock out", description: error.message, variant: "destructive" });
    },
  });

  if (shiftsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const upcomingShifts = shifts.filter((s: any) => s.status === "confirmed" || s.status === "pending" || s.status === "open");
  const confirmedShifts = shifts.filter((s: any) => s.status === "confirmed");

  const activeShift = confirmedShifts.length > 0 ? confirmedShifts[0] : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">My Schedule</h1>
        <p className="text-muted-foreground mt-1">View and manage your upcoming shifts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Upcoming Shifts"
          value={upcomingShifts.length}
          icon={Calendar}
        />
        <StatCard
          title="Confirmed Shifts"
          value={confirmedShifts.length}
          icon={Clock}
        />
        <StatCard
          title="Total Shifts"
          value={shifts.length}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">My Shifts</h2>
          <div className="space-y-4">
            {shifts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No shifts assigned yet.</p>
            ) : (
              shifts.map((shift: any) => (
                <ShiftCard
                  key={shift.id}
                  id={shift.id}
                  eventTitle={shift.event?.title || "Unknown Event"}
                  venue={shift.event?.venue || "Unknown Venue"}
                  date={new Date(shift.event?.date || Date.now())}
                  startTime={shift.event?.startTime || ""}
                  endTime={shift.event?.endTime || ""}
                  role={shift.role}
                  status={shift.status}
                  payRate={shift.payRate || undefined}
                  assignmentType={shift.assignmentType}
                  onAccept={() => respondMutation.mutate({ id: shift.id, action: "accept" })}
                  onReject={() => respondMutation.mutate({ id: shift.id, action: "reject" })}
                  onViewDetails={() => console.log("View details:", shift.id)}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Current Shift</h2>
          <TimeTracker
            shiftId={activeTimeEntry?.shiftId || "none"}
            shiftTitle={activeTimeEntry
              ? (() => { const s = shifts.find((sh: any) => sh.id === activeTimeEntry.shiftId); return s ? `${s.event?.title} - ${s.role}` : "Active Shift"; })()
              : (activeShift ? `${activeShift.event?.title} - ${activeShift.role}` : "No active shift")}
            isActive={!!activeTimeEntry}
            startTime={activeTimeEntry ? new Date(activeTimeEntry.clockIn) : undefined}
            onClockIn={() => {
              if (activeShift) {
                clockInMutation.mutate(activeShift.id);
              }
            }}
            onClockOut={() => clockOutMutation.mutate()}
          />
        </div>
      </div>
    </div>
  );
}
