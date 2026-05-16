import * as React from "react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "text-xl", md: "text-3xl", lg: "text-4xl" };

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  return (
    <div className="flex gap-1" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          className={[
            sizeMap[size],
            "transition-colors",
            star <= value ? "text-yellow-400" : "text-gray-300",
            !readonly ? "hover:text-yellow-300 cursor-pointer" : "cursor-default",
          ].join(" ")}
        >
          ★
        </button>
      ))}
    </div>
  );
}
