import { StatCard } from "@/components/stat-card";
import { EventCard } from "@/components/event-card";
import { Calendar, Users, Clock, CheckCircle, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useLocation } from "wouter";
import type { Event, StaffProfile } from "@shared/schema";
import type { User } from "@shared/models/auth";

const createEventFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  venue: z.string().min(1, "Venue is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  description: z.string().optional(),
  requiredStaff: z.string().optional(),
});

export default function AdminDashboard() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, navigate] = useLocation();

  const form = useForm<z.infer<typeof createEventFormSchema>>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      title: "",
      venue: "",
      date: "",
      startTime: "",
      endTime: "",
      description: "",
      requiredStaff: "",
    },
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery<(StaffProfile & { user: User })[]>({
    queryKey: ["/api/staff"],
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createEventFormSchema>) => {
      await apiRequest("POST", "/api/events", {
        ...data,
        requiredStaff: data.requiredStaff ? parseInt(data.requiredStaff) : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Event created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create event", description: error.message, variant: "destructive" });
    },
  });

  if (eventsLoading || staffLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const upcomingEvents = events.filter((e) => e.status === "published" || e.status === "draft");
  const completedEvents = events.filter((e) => e.status === "completed");
  const activeStaff = staff.filter((s) => s.isActive);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your staffing operations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-event">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createEventMutation.mutate(data))} className="space-y-4 pt-2">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="Event title" {...field} data-testid="input-event-title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="venue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl><Input placeholder="Venue name" {...field} data-testid="input-event-venue" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-event-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl><Input placeholder="6:00 PM" {...field} data-testid="input-event-start-time" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl><Input placeholder="11:00 PM" {...field} data-testid="input-event-end-time" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="requiredStaff" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Staff</FormLabel>
                    <FormControl><Input type="number" placeholder="10" {...field} data-testid="input-required-staff" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl><Textarea placeholder="Event details..." {...field} data-testid="input-event-description" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createEventMutation.isPending} data-testid="button-submit-event">
                  {createEventMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Event
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Upcoming Events" value={upcomingEvents.length} icon={Calendar} />
        <StatCard title="Active Staff" value={activeStaff.length} icon={Users} />
        <StatCard title="Total Events" value={events.length} icon={Clock} />
        <StatCard title="Completed Events" value={completedEvents.length} icon={CheckCircle} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8" data-testid="text-no-events">
              No events yet. Create your first event to get started.
            </p>
          ) : (
            events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                venue={event.venue}
                venueAddress={event.venueAddress || undefined}
                date={new Date(event.date)}
                startTime={event.startTime}
                endTime={event.endTime}
                status={event.status as "draft" | "published" | "completed" | "cancelled"}
                requiredStaff={event.requiredStaff || 0}
                onManage={() => navigate(`/events/${event.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
