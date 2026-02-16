import { TimeTracker } from "../time-tracker";

export default function TimeTrackerExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 max-w-4xl">
      <TimeTracker
        shiftId="1"
        shiftTitle="Annual Gala Dinner - Server"
        isActive={false}
        onClockIn={() => console.log("Clock in clicked")}
      />
      <TimeTracker
        shiftId="2"
        shiftTitle="Corporate Conference - Event Coordinator"
        isActive={true}
        startTime={new Date(Date.now() - 3600000)}
        onClockOut={() => console.log("Clock out clicked")}
      />
    </div>
  );
}
