import { ReviewCard } from "../review-card";

export default function ReviewCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 max-w-4xl">
      <ReviewCard
        id="1"
        reviewerName="Sarah Manager"
        rating={5}
        comment="Excellent work! Very professional and attentive to detail. Would definitely hire again for future events."
        date={new Date(2025, 9, 16)}
        shiftTitle="Annual Gala Dinner"
      />
      <ReviewCard
        id="2"
        reviewerName="John Supervisor"
        rating={4}
        comment="Great job overall. Showed up on time and handled all responsibilities well."
        date={new Date(2025, 9, 14)}
        shiftTitle="Corporate Conference"
      />
      <ReviewCard
        id="3"
        reviewerName="Emily Coordinator"
        rating={5}
        comment="Outstanding performance! Went above and beyond expectations."
        date={new Date(2025, 9, 12)}
        shiftTitle="Wedding Reception"
      />
    </div>
  );
}
