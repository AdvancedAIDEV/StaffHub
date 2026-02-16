import { StaffListItem } from "../staff-list-item";

export default function StaffListItemExample() {
  return (
    <div className="space-y-4 p-8 max-w-3xl">
      <StaffListItem
        id="1"
        name="Sarah Johnson"
        email="sarah.j@example.com"
        phone="+1 (555) 123-4567"
        role="Senior Server"
        isActive={true}
        onMessage={() => console.log("Message clicked")}
        onViewProfile={() => console.log("View profile clicked")}
      />
      <StaffListItem
        id="2"
        name="Michael Chen"
        email="michael.chen@example.com"
        phone="+1 (555) 987-6543"
        role="Bartender"
        isActive={true}
        onMessage={() => console.log("Message clicked")}
        onViewProfile={() => console.log("View profile clicked")}
      />
      <StaffListItem
        id="3"
        name="Emily Rodriguez"
        email="emily.r@example.com"
        role="Event Coordinator"
        isActive={false}
        onMessage={() => console.log("Message clicked")}
        onViewProfile={() => console.log("View profile clicked")}
      />
    </div>
  );
}
