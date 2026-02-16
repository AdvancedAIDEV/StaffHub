import { ShiftCard } from "../shift-card";

export default function ShiftCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
      <ShiftCard
        id="1"
        eventTitle="Annual Gala Dinner"
        venue="Grand Hotel Ballroom"
        date={new Date(2025, 9, 20)}
        startTime="6:00 PM"
        endTime="11:00 PM"
        role="Server"
        status="pending"
        payRate={2500}
        assignmentType="seekreply"
        onAccept={() => console.log("Accept clicked")}
        onReject={() => console.log("Reject clicked")}
      />
      <ShiftCard
        id="2"
        eventTitle="Corporate Lunch"
        venue="Downtown Conference Room"
        date={new Date(2025, 9, 22)}
        startTime="11:00 AM"
        endTime="2:00 PM"
        role="Bartender"
        status="open"
        payRate={3000}
        assignmentType="publishing"
        onAccept={() => console.log("Claim clicked")}
      />
      <ShiftCard
        id="3"
        eventTitle="Wedding Reception"
        venue="Garden Venue"
        date={new Date(2025, 9, 18)}
        startTime="5:00 PM"
        endTime="10:00 PM"
        role="Event Coordinator"
        status="confirmed"
        payRate={3500}
        assignmentType="autoconfirm"
        onViewDetails={() => console.log("View details clicked")}
      />
    </div>
  );
}
