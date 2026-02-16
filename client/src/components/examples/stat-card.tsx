import { StatCard } from "../stat-card";
import { Calendar, Users, Clock, CheckCircle } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-8">
      <StatCard
        title="Upcoming Events"
        value={12}
        icon={Calendar}
        trend="+3 from last week"
        trendUp={true}
      />
      <StatCard
        title="Active Staff"
        value={45}
        icon={Users}
        trend="+5 this month"
        trendUp={true}
      />
      <StatCard
        title="Hours Tracked"
        value="1,234"
        icon={Clock}
        trend="+120 from last week"
        trendUp={true}
      />
      <StatCard
        title="Confirmed Shifts"
        value={87}
        icon={CheckCircle}
        trend="-2 from yesterday"
        trendUp={false}
      />
    </div>
  );
}
