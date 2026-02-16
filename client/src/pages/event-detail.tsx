import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useState } from "react";
import {
  ArrowLeft, MapPin, Calendar, Clock, Users, Plus, Loader2,
  Pencil, Trash2, UserPlus, DollarSign, FileText
} from "lucide-react";
import { format } from "date-fns";
import type { Event, Shift, StaffProfile } from "@shared/schema";
import type { User } from "@shared/models/auth";

type EventWithCounts = Event & { shiftCount: number; confirmedCount: number };
type ShiftWithStaff = Shift & { staff?: User | null };

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  published: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const shiftStatusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const createShiftFormSchema = z.object({
  role: z.string().min(1, "Role is required"),
  assignmentType: z.enum(["autoconfirm", "seekreply", "publishing"]),
  payRate: z.string().optional(),
  notes: z.string().optional(),
  breakMinutes: z.string().optional(),
  staffId: z.string().optional(),
});

const editEventFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  venue: z.string().min(1, "Venue is required"),
  venueAddress: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  description: z.string().optional(),
  uniformRequirements: z.string().optional(),
  specialInstructions: z.string().optional(),
  requiredStaff: z.string().optional(),
  status: z.string().optional(),
});

function getStaffName(user?: User | null): string {
  if (!user) return "Unassigned";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown";
}

function getStaffInitials(user?: User | null): string {
  if (!user) return "?";
  const first = user.firstName?.[0] || "";
  const last = user.lastName?.[0] || "";
  if (first || last) return (first + last).toUpperCase();
  return (user.email?.[0] || "U").toUpperCase();
}

export default function EventDetail() {
  const [, params] = useRoute("/events/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const eventId = params?.id || "";

  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: event, isLoading } = useQuery<EventWithCounts>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const { data: eventShifts = [], isLoading: shiftsLoading } = useQuery<ShiftWithStaff[]>({
    queryKey: ["/api/events", eventId, "shifts"],
    enabled: !!eventId,
  });

  const { data: staffList = [] } = useQuery<(StaffProfile & { user: User })[]>({
    queryKey: ["/api/staff"],
  });

  const shiftForm = useForm<z.infer<typeof createShiftFormSchema>>({
    resolver: zodResolver(createShiftFormSchema),
    defaultValues: {
      role: "",
      assignmentType: "seekreply",
      payRate: "",
      notes: "",
      breakMinutes: "",
      staffId: "",
    },
  });

  const editForm = useForm<z.infer<typeof editEventFormSchema>>({
    resolver: zodResolver(editEventFormSchema),
    defaultValues: {
      title: "",
      venue: "",
      venueAddress: "",
      date: "",
      startTime: "",
      endTime: "",
      description: "",
      uniformRequirements: "",
      specialInstructions: "",
      requiredStaff: "0",
      status: "draft",
    },
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createShiftFormSchema>) => {
      await apiRequest("POST", "/api/shifts", {
        eventId,
        role: data.role,
        assignmentType: data.assignmentType,
        payRate: data.payRate ? Math.round(parseFloat(data.payRate) * 100) : undefined,
        notes: data.notes || undefined,
        breakMinutes: data.breakMinutes ? parseInt(data.breakMinutes) : undefined,
        staffId: data.staffId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      setShiftDialogOpen(false);
      shiftForm.reset();
      toast({ title: "Shift created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create shift", description: error.message, variant: "destructive" });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editEventFormSchema>) => {
      await apiRequest("PATCH", `/api/events/${eventId}`, {
        title: data.title,
        venue: data.venue,
        venueAddress: data.venueAddress || null,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description || null,
        uniformRequirements: data.uniformRequirements || null,
        specialInstructions: data.specialInstructions || null,
        requiredStaff: data.requiredStaff ? parseInt(data.requiredStaff) : 0,
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setEditDialogOpen(false);
      toast({ title: "Event updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update event", description: error.message, variant: "destructive" });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      await apiRequest("DELETE", `/api/shifts/${shiftId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      toast({ title: "Shift deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete shift", variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      navigate("/");
      toast({ title: "Event deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete event", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PATCH", `/api/events/${eventId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Status updated" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Event not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const openEditDialog = () => {
    editForm.reset({
      title: event.title,
      venue: event.venue,
      venueAddress: event.venueAddress || "",
      date: format(new Date(event.date), "yyyy-MM-dd"),
      startTime: event.startTime,
      endTime: event.endTime,
      description: event.description || "",
      uniformRequirements: event.uniformRequirements || "",
      specialInstructions: event.specialInstructions || "",
      requiredStaff: String(event.requiredStaff || 0),
      status: event.status,
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold truncate" data-testid="text-event-title">{event.title}</h1>
            <Badge className={statusColors[event.status] || ""} data-testid="badge-event-status">{event.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{event.venue}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openEditDialog} data-testid="button-edit-event">
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          {event.status === "draft" && (
            <Button size="sm" onClick={() => updateStatusMutation.mutate("published")} data-testid="button-publish-event">
              Publish
            </Button>
          )}
          {event.status === "published" && (
            <Button size="sm" onClick={() => updateStatusMutation.mutate("completed")} data-testid="button-complete-event">
              Complete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{event.venue}</p>
                    {event.venueAddress && <p className="text-xs text-muted-foreground">{event.venueAddress}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{event.startTime} - {event.endTime}</p>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{event.confirmedCount}/{event.requiredStaff || event.shiftCount} staff confirmed</p>
                </div>
              </div>
              {event.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{event.description}</p>
                  </div>
                </>
              )}
              {event.uniformRequirements && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Uniform Requirements</p>
                  <p className="text-sm">{event.uniformRequirements}</p>
                </div>
              )}
              {event.specialInstructions && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Special Instructions</p>
                  <p className="text-sm">{event.specialInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">Shifts ({eventShifts.length})</CardTitle>
              <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-shift">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Shift
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Shift</DialogTitle>
                  </DialogHeader>
                  <Form {...shiftForm}>
                    <form onSubmit={shiftForm.handleSubmit((data) => createShiftMutation.mutate(data))} className="space-y-4 pt-2">
                      <FormField
                        control={shiftForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-shift-role">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Server">Server</SelectItem>
                                <SelectItem value="Bartender">Bartender</SelectItem>
                                <SelectItem value="Event Coordinator">Event Coordinator</SelectItem>
                                <SelectItem value="Supervisor">Supervisor</SelectItem>
                                <SelectItem value="Chef">Chef</SelectItem>
                                <SelectItem value="Security">Security</SelectItem>
                                <SelectItem value="Host">Host</SelectItem>
                                <SelectItem value="Setup Crew">Setup Crew</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={shiftForm.control}
                        name="assignmentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assignment Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-assignment-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="autoconfirm">AutoConfirm - Instant assignment</SelectItem>
                                <SelectItem value="seekreply">SeekReply - Accept/Decline offer</SelectItem>
                                <SelectItem value="publishing">Publishing - Open for claiming</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {shiftForm.watch("assignmentType") !== "publishing" && (
                        <FormField
                          control={shiftForm.control}
                          name="staffId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assign To</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-staff-assign">
                                    <SelectValue placeholder="Select staff member" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">Unassigned</SelectItem>
                                  {staffList.map((s) => (
                                    <SelectItem key={s.userId} value={s.userId}>
                                      {getStaffName(s.user)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={shiftForm.control}
                        name="payRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pay Rate ($/hr)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.50" placeholder="25.00" {...field} data-testid="input-pay-rate" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={shiftForm.control}
                        name="breakMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Break (minutes)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="30" {...field} data-testid="input-break-minutes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={shiftForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Any special instructions for this shift..." {...field} data-testid="input-shift-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createShiftMutation.isPending} data-testid="button-submit-shift">
                        {createShiftMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Create Shift
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {shiftsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : eventShifts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm" data-testid="text-no-shifts">
                  No shifts created yet. Add shifts to start assigning staff.
                </div>
              ) : (
                <div className="space-y-3">
                  {eventShifts.map((shift) => (
                    <div key={shift.id} className="flex items-center gap-3 p-3 rounded-md border border-border" data-testid={`shift-row-${shift.id}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={shift.staff?.profileImageUrl || ""} />
                        <AvatarFallback className="text-xs">{getStaffInitials(shift.staff)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{shift.role}</p>
                          <Badge className={shiftStatusColors[shift.status] || ""} data-testid={`badge-shift-status-${shift.id}`}>
                            {shift.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {shift.assignmentType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>{getStaffName(shift.staff)}</span>
                          {shift.payRate && (
                            <span className="flex items-center gap-0.5">
                              <DollarSign className="h-3 w-3" />
                              {(shift.payRate / 100).toFixed(2)}/hr
                            </span>
                          )}
                          {shift.breakMinutes && <span>{shift.breakMinutes}min break</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteShiftMutation.mutate(shift.id)}
                        data-testid={`button-delete-shift-${shift.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {event.status === "draft" && (
                <Button className="w-full" onClick={() => updateStatusMutation.mutate("published")} data-testid="button-publish-sidebar">
                  Publish Event
                </Button>
              )}
              {event.status === "published" && (
                <Button className="w-full" onClick={() => updateStatusMutation.mutate("completed")} data-testid="button-complete-sidebar">
                  Mark Completed
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={openEditDialog} data-testid="button-edit-sidebar">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this event? This will also delete all associated shifts.")) {
                    deleteEventMutation.mutate();
                  }
                }}
                data-testid="button-delete-event"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Shifts</span>
                <span className="font-medium">{event.shiftCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confirmed</span>
                <span className="font-medium">{event.confirmedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Open</span>
                <span className="font-medium">{eventShifts.filter(s => s.status === "open").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">{eventShifts.filter(s => s.status === "pending").length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => updateEventMutation.mutate(data))} className="space-y-4 pt-2">
              <FormField control={editForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} data-testid="input-edit-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="venue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl><Input {...field} data-testid="input-edit-venue" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="venueAddress" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input {...field} data-testid="input-edit-address" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={editForm.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-edit-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="startTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl><Input {...field} placeholder="6:00 PM" data-testid="input-edit-start" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="endTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl><Input {...field} placeholder="11:00 PM" data-testid="input-edit-end" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} data-testid="input-edit-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="requiredStaff" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Staff</FormLabel>
                    <FormControl><Input type="number" {...field} data-testid="input-edit-required-staff" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="uniformRequirements" render={({ field }) => (
                <FormItem>
                  <FormLabel>Uniform Requirements</FormLabel>
                  <FormControl><Input {...field} placeholder="Black shirt, black pants" data-testid="input-edit-uniform" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="specialInstructions" render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions</FormLabel>
                  <FormControl><Textarea {...field} data-testid="input-edit-instructions" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={updateEventMutation.isPending} data-testid="button-submit-edit">
                {updateEventMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
