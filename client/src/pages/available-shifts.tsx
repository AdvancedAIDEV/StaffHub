import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ShiftCard } from "@/components/shift-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, CalendarRange } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Shift, Event } from "@shared/schema";

type ShiftWithEvent = Shift & { event: Event };

export default function AvailableShifts() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const { data: shifts = [], isLoading } = useQuery<ShiftWithEvent[]>({
    queryKey: ["/api/shifts/available"],
  });

  const claimMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      await apiRequest("PATCH", `/api/shifts/${shiftId}/respond`, { action: "claim" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts/my"] });
      toast({ title: "Shift claimed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to claim shift", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allRoles = Array.from(new Set(shifts.map(s => s.role)));

  let filtered = shifts.filter(s => {
    const matchesSearch = searchTerm
      ? s.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesRole = roleFilter === "all" || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  filtered.sort((a, b) => {
    if (sortBy === "date") {
      return new Date(a.event.date).getTime() - new Date(b.event.date).getTime();
    }
    if (sortBy === "pay") {
      return (b.payRate || 0) - (a.payRate || 0);
    }
    if (sortBy === "role") {
      return a.role.localeCompare(b.role);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">Available Shifts</h1>
        <p className="text-muted-foreground mt-1">Browse and claim open shifts</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by event, venue, or role..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-shifts"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-role-filter">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {allRoles.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]" data-testid="select-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="pay">Sort by Pay</SelectItem>
            <SelectItem value="role">Sort by Role</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2" data-testid="text-empty-state">
          <CalendarRange className="h-10 w-10" />
          <p>{searchTerm || roleFilter !== "all"
            ? "No shifts match your filters."
            : "No available shifts at the moment. Check back later."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((shift) => (
            <ShiftCard
              key={shift.id}
              id={shift.id}
              eventTitle={shift.event.title}
              venue={shift.event.venue}
              date={new Date(shift.event.date)}
              startTime={shift.event.startTime}
              endTime={shift.event.endTime}
              role={shift.role}
              status={shift.status as any}
              payRate={shift.payRate || undefined}
              assignmentType={shift.assignmentType as any}
              onAccept={() => claimMutation.mutate(shift.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
