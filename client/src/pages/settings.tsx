import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Bell, MessageSquare, Calendar, Clock, Briefcase, MapPin, Loader2, Mail } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { StaffProfile } from "@shared/schema";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery<StaffProfile>({
    queryKey: ["/api/profile"],
  });

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [shiftReminders, setShiftReminders] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [scheduleUpdates, setScheduleUpdates] = useState(true);
  const [readyPoolEnabled, setReadyPoolEnabled] = useState(true);
  const [autoAcceptShifts, setAutoAcceptShifts] = useState(false);
  const [showAvailability, setShowAvailability] = useState(true);
  const [assignmentPreference, setAssignmentPreference] = useState("seekreply");
  const [distanceLimit, setDistanceLimit] = useState("25");
  const [uniformSize, setUniformSize] = useState("m");
  const [certifications, setCertifications] = useState("");
  const [preferredRoles, setPreferredRoles] = useState("server");
  const [minPayRate, setMinPayRate] = useState("20.00");
  const [preferredAreas, setPreferredAreas] = useState("");

  useEffect(() => {
    if (profile) {
      setEmailNotifications(profile.emailNotifications ?? true);
      setPushNotifications(profile.pushNotifications ?? true);
      setShiftReminders(profile.shiftReminders ?? true);
      setMessageNotifications(profile.messageNotifications ?? true);
      setScheduleUpdates(profile.scheduleUpdates ?? true);
      setReadyPoolEnabled(profile.readyPoolEnabled ?? true);
      setAssignmentPreference(profile.assignmentPreference || "seekreply");
      setAutoAcceptShifts(profile.autoAcceptShifts ?? false);
      setShowAvailability(profile.showAvailability ?? true);
      setUniformSize(profile.uniformSize || "m");
      setCertifications(profile.certifications || "");
      setPreferredRoles(profile.preferredRoles || "server");
      setMinPayRate(profile.minPayRate ? (profile.minPayRate / 100).toFixed(2) : "20.00");
      setDistanceLimit(profile.maxDistance ? String(profile.maxDistance) : "25");
      setPreferredAreas(profile.preferredAreas || "");
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/profile", {
        emailNotifications,
        pushNotifications,
        shiftReminders,
        messageNotifications,
        scheduleUpdates,
        readyPoolEnabled,
        assignmentPreference,
        autoAcceptShifts,
        showAvailability,
        uniformSize,
        certifications: certifications || null,
        preferredRoles: preferredRoles || null,
        minPayRate: minPayRate ? Math.round(parseFloat(minPayRate) * 100) : null,
        maxDistance: distanceLimit === "unlimited" ? null : parseInt(distanceLimit),
        preferredAreas: preferredAreas || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save settings", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Account
          </CardTitle>
          <CardDescription>Your account information (managed by Replit Auth)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium" data-testid="text-email">{user?.email || "Not set"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium" data-testid="text-name">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Not set"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Control how you receive updates and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} data-testid="toggle-email-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications" className="text-base">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
            </div>
            <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} data-testid="toggle-push-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="shift-reminders" className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Shift Reminders
              </Label>
              <p className="text-sm text-muted-foreground">Get reminded before your shifts start</p>
            </div>
            <Switch id="shift-reminders" checked={shiftReminders} onCheckedChange={setShiftReminders} data-testid="toggle-shift-reminders" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="message-notifications" className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message Notifications
              </Label>
              <p className="text-sm text-muted-foreground">Notify when you receive new messages</p>
            </div>
            <Switch id="message-notifications" checked={messageNotifications} onCheckedChange={setMessageNotifications} data-testid="toggle-message-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="schedule-updates" className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Updates
              </Label>
              <p className="text-sm text-muted-foreground">Get notified when schedules change</p>
            </div>
            <Switch id="schedule-updates" checked={scheduleUpdates} onCheckedChange={setScheduleUpdates} data-testid="toggle-schedule-updates" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Availability & Scheduling</CardTitle>
          <CardDescription>Configure how shifts are assigned to you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ready-pool" className="text-base">Ready Pool Availability</Label>
              <p className="text-sm text-muted-foreground">Signal your availability for specific dates to get priority shift offers</p>
            </div>
            <Switch id="ready-pool" checked={readyPoolEnabled} onCheckedChange={setReadyPoolEnabled} data-testid="toggle-ready-pool" />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="assignment-preference" className="text-base">Preferred Assignment Method</Label>
            <Select value={assignmentPreference} onValueChange={setAssignmentPreference}>
              <SelectTrigger id="assignment-preference" data-testid="select-assignment-preference">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="autoconfirm">AutoConfirm - Instant assignment</SelectItem>
                <SelectItem value="seekreply">SeekReply - Accept/Decline offers</SelectItem>
                <SelectItem value="publishing">Publishing - Claim available shifts</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Your preferred method for receiving shift assignments</p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-accept" className="text-base">Auto-Accept Shifts</Label>
              <p className="text-sm text-muted-foreground">Automatically accept shifts that match your availability and preferences</p>
            </div>
            <Switch id="auto-accept" checked={autoAcceptShifts} onCheckedChange={setAutoAcceptShifts} data-testid="toggle-auto-accept" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-availability" className="text-base">Show Availability to Admins</Label>
              <p className="text-sm text-muted-foreground">Let admins see when you're available for scheduling</p>
            </div>
            <Switch id="show-availability" checked={showAvailability} onCheckedChange={setShowAvailability} data-testid="toggle-show-availability" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Profile
          </CardTitle>
          <CardDescription>Update your work preferences and qualifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="roles">Preferred Roles</Label>
            <Select value={preferredRoles} onValueChange={setPreferredRoles}>
              <SelectTrigger id="roles" data-testid="select-roles">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="server">Server</SelectItem>
                <SelectItem value="bartender">Bartender</SelectItem>
                <SelectItem value="coordinator">Event Coordinator</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="chef">Chef</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications & Skills</Label>
            <Textarea
              id="certifications"
              placeholder="e.g., Food Handler Certificate, Mixology License, First Aid"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              data-testid="input-certifications"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="uniform-size">Uniform Size</Label>
            <Select value={uniformSize} onValueChange={setUniformSize}>
              <SelectTrigger id="uniform-size" data-testid="select-uniform-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xs">Extra Small</SelectItem>
                <SelectItem value="s">Small</SelectItem>
                <SelectItem value="m">Medium</SelectItem>
                <SelectItem value="l">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
                <SelectItem value="xxl">2X Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="min-pay-rate">Minimum Hourly Rate</Label>
            <div className="flex items-center gap-2">
              <span className="text-lg text-muted-foreground">$</span>
              <Input
                id="min-pay-rate"
                type="number"
                placeholder="25.00"
                value={minPayRate}
                onChange={(e) => setMinPayRate(e.target.value)}
                step="0.50"
                data-testid="input-min-pay-rate"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Preferences
          </CardTitle>
          <CardDescription>Set your travel distance and preferred work areas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="distance-limit">Maximum Travel Distance</Label>
            <Select value={distanceLimit} onValueChange={setDistanceLimit}>
              <SelectTrigger id="distance-limit" data-testid="select-distance-limit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 miles</SelectItem>
                <SelectItem value="25">25 miles</SelectItem>
                <SelectItem value="50">50 miles</SelectItem>
                <SelectItem value="100">100 miles</SelectItem>
                <SelectItem value="unlimited">No limit</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Only show shifts within this distance from your location</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="preferred-areas">Preferred Work Areas</Label>
            <Textarea
              id="preferred-areas"
              placeholder="e.g., Downtown, Financial District, Marina"
              value={preferredAreas}
              onChange={(e) => setPreferredAreas(e.target.value)}
              data-testid="input-preferred-areas"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-8">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          data-testid="button-save-settings"
        >
          {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
