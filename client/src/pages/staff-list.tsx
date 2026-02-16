import { StaffListItem } from "@/components/staff-list-item";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function StaffList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();

  const { data: staffData = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/staff"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const mappedStaff = staffData.map((s: any) => ({
    id: s.userId,
    name: [s.user?.firstName, s.user?.lastName].filter(Boolean).join(" ") || s.user?.email || "Unknown",
    email: s.user?.email || "",
    phone: s.phone || "",
    role: s.role,
    avatarUrl: s.user?.profileImageUrl || "",
    isActive: s.isActive,
  }));

  const filteredStaff = mappedStaff.filter((staff) =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Staff</h1>
          <p className="text-muted-foreground mt-1">Manage your team members</p>
        </div>
        <Button data-testid="button-add-staff">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff by name or email..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-staff"
        />
      </div>

      <div className="space-y-4">
        {filteredStaff.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {searchTerm ? "No staff members match your search." : "No staff members yet."}
          </p>
        ) : (
          filteredStaff.map((staff) => (
            <StaffListItem
              key={staff.id}
              {...staff}
              onMessage={() => navigate(`/messages?to=${staff.id}`)}
              onViewProfile={() => navigate(`/staff/${staff.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
