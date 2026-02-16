import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";

interface StaffListItemProps {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  avatarUrl?: string;
  isActive?: boolean;
  onMessage?: () => void;
  onViewProfile?: () => void;
}

export function StaffListItem({
  id,
  name,
  email,
  phone,
  role,
  avatarUrl,
  isActive = true,
  onMessage,
  onViewProfile,
}: StaffListItemProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover-elevate" data-testid={`staff-item-${id}`}>
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm truncate" data-testid={`text-staff-name-${id}`}>{name}</h4>
          {isActive ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Inactive</Badge>
          )}
        </div>
        {role && <p className="text-xs text-muted-foreground mt-1">{role}</p>}
        <div className="flex items-center gap-4 mt-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{email}</span>
          </div>
          {phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{phone}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onMessage}
          data-testid={`button-message-staff-${id}`}
        >
          Message
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onViewProfile}
          data-testid={`button-view-profile-${id}`}
        >
          View
        </Button>
      </div>
    </div>
  );
}
