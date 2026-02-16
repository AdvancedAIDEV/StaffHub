import { EventCard } from "../event-card";

export default function EventCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
      <EventCard
        id="1"
        title="Annual Gala Dinner"
        venue="Grand Hotel Ballroom"
        venueAddress="123 Main St, Downtown"
        date={new Date(2025, 9, 20)}
        startTime="6:00 PM"
        endTime="11:00 PM"
        status="published"
        staffCount={8}
        requiredStaff={12}
        onManage={() => console.log("Manage event clicked")}
      />
      <EventCard
        id="2"
        title="Corporate Conference"
        venue="Convention Center"
        venueAddress="456 Business Blvd"
        date={new Date(2025, 9, 25)}
        startTime="8:00 AM"
        endTime="5:00 PM"
        status="draft"
        staffCount={0}
        requiredStaff={20}
        onManage={() => console.log("Manage event clicked")}
      />
      <EventCard
        id="3"
        title="Wedding Reception"
        venue="Garden Venue"
        date={new Date(2025, 9, 18)}
        startTime="5:00 PM"
        endTime="10:00 PM"
        status="completed"
        staffCount={15}
        requiredStaff={15}
        onManage={() => console.log("Manage event clicked")}
      />
    </div>
  );
}
