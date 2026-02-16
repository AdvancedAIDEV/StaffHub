import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Loader2, MessageSquare } from "lucide-react";
import type { StaffProfile } from "@shared/schema";
import type { User } from "@shared/models/auth";

type StaffWithUser = StaffProfile & { user: User | null };

export default function StaffProfileView() {
  const [, params] = useRoute("/staff/:userId");
  const [, navigate] = useLocation();
  const userId = params?.userId || "";

  const { data: profile, isLoading } = useQuery<StaffWithUser>({
    queryKey: ["/api/staff", userId],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Staff member not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/staff")}>
          Back to Staff List
        </Button>
      </div>
    );
  }

  const user = profile.user;
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown" : "Unknown";
  const initials = user
    ? ((user.firstName?.[0] || "") + (user.lastName?.[0] || "")).toUpperCase() || (user.email?.[0] || "U").toUpperCase()
    : "U";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/staff")} data-testid="button-back-staff">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold" data-testid="text-staff-name">{name}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h2 className="text-xl font-semibold">{name}</h2>
                {user?.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge>{profile.role}</Badge>
                <Badge variant={profile.isActive ? "default" : "secondary"}>
                  {profile.isActive ? "Active" : "Inactive"}
                </Badge>
                {profile.readyPoolEnabled && <Badge variant="outline">Ready Pool</Badge>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/messages?to=${userId}`)}
                data-testid="button-message-staff"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Send Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assignment Preference</span>
              <span className="font-medium">{profile.assignmentPreference || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto-accept Shifts</span>
              <span className="font-medium">{profile.autoAcceptShifts ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Availability Visible</span>
              <span className="font-medium">{profile.showAvailability ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ready Pool</span>
              <span className="font-medium">{profile.readyPoolEnabled ? "Yes" : "No"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact & Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{profile.phone || "Not provided"}</span>
            </div>
            {profile.preferredAreas && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preferred Areas</span>
                <span className="font-medium">{profile.preferredAreas}</span>
              </div>
            )}
            {profile.certifications && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Certifications</span>
                <span className="font-medium">{profile.certifications}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
