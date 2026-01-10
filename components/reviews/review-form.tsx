"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  contractorId: string;
  contractorName: string;
  bookingId?: string;
  customerId: string;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({
  isOpen,
  onClose,
  contractorId,
  contractorName,
  bookingId,
  customerId,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Rating Required", {
        description: "Please select a rating before submitting",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          contractorId,
          customerId,
          rating,
          title: title.trim() || null,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Review Submitted!", {
          description: `Thank you for reviewing ${contractorName}`,
        });
        setRating(0);
        setTitle("");
        setComment("");
        onClose();
        onReviewSubmitted?.();
      } else {
        toast.error("Failed to Submit Review", {
          description: data.error || "Please try again later",
        });
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Something Went Wrong", {
        description: "Unable to submit your review. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setTitle("");
      setComment("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            Review {contractorName}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Share your experience with this contractor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Rating Stars */}
          <div>
            <Label className="text-zinc-300 mb-3 block">
              Rating <span className="text-red-400">*</span>
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-zinc-600"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-zinc-400 mt-2">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Review Title */}
          <div>
            <Label className="text-zinc-300 mb-2 block">
              Review Title (Optional)
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience..."
              className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
              maxLength={100}
            />
          </div>

          {/* Review Comment */}
          <div>
            <Label className="text-zinc-300 mb-2 block">
              Your Review (Optional)
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 min-h-30 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-zinc-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-white/10 text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
