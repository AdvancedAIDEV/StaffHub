import { ReviewCard } from "@/components/review-card";
import { Star, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Reviews() {
  const { data: reviews = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/reviews/my"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const mappedReviews = reviews.map((r: any) => {
    const reviewer = r.reviewer;
    const reviewerName = reviewer
      ? [reviewer.firstName, reviewer.lastName].filter(Boolean).join(" ") || reviewer.email || "Unknown"
      : "Unknown";
    return {
      id: r.id,
      reviewerName,
      rating: r.rating,
      comment: r.comment || "",
      date: new Date(r.createdAt),
      shiftTitle: r.shift?.role || "",
    };
  });

  const averageRating = mappedReviews.length > 0
    ? (mappedReviews.reduce((sum, r) => sum + r.rating, 0) / mappedReviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Reviews</h1>
          <p className="text-muted-foreground mt-1">Performance feedback and ratings</p>
        </div>
      </div>

      <div className="bg-muted rounded-lg p-6 flex items-center gap-8">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold" data-testid="text-average-rating">{averageRating}</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(Number(averageRating))
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = mappedReviews.filter((r) => r.rating === stars).length;
            const percentage = mappedReviews.length > 0 ? (count / mappedReviews.length) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-xs w-12">{stars} stars</span>
                <div className="flex-1 bg-background rounded-full h-2">
                  <div
                    className="bg-amber-400 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Reviews</h2>
        {mappedReviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No reviews yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mappedReviews.map((review) => (
              <ReviewCard key={review.id} {...review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
