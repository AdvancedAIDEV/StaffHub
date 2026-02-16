import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface ReviewCardProps {
  id: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment?: string;
  date: Date;
  shiftTitle?: string;
}

export function ReviewCard({
  id,
  reviewerName,
  reviewerAvatar,
  rating,
  comment,
  date,
  shiftTitle,
}: ReviewCardProps) {
  return (
    <Card data-testid={`review-card-${id}`}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={reviewerAvatar} />
            <AvatarFallback>
              {reviewerName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-sm" data-testid={`text-reviewer-name-${id}`}>{reviewerName}</h4>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
            {shiftTitle && (
              <p className="text-xs text-muted-foreground mt-1">{shiftTitle}</p>
            )}
            <p className="text-xs text-muted-foreground">{format(date, "MMM d, yyyy")}</p>
          </div>
        </div>
      </CardHeader>
      {comment && (
        <CardContent>
          <p className="text-sm text-muted-foreground" data-testid={`text-review-comment-${id}`}>{comment}</p>
        </CardContent>
      )}
    </Card>
  );
}
