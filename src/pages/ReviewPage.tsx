import { useMemo, useState } from "react";
import { CheckCircle, Star } from "lucide-react";
import type { Page } from "../hooks/useRouter";
import { useAsyncData } from "../hooks/useAsyncData";
import { getReviewByToken, submitReview } from "../lib/studioApi";

interface ReviewPageProps {
  navigate: (page: Page) => void;
}

export default function ReviewPage({ navigate }: ReviewPageProps) {
  const reviewToken = useMemo(() => new URLSearchParams(window.location.search).get("reviewToken") ?? "", []);
  const { data: review } = useAsyncData(() => reviewToken ? getReviewByToken(reviewToken) : Promise.resolve(null), [reviewToken]);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [publicLocation, setPublicLocation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reviewToken) return;
    try {
      await submitReview({
        reviewToken,
        rating,
        message,
        publicLocation: publicLocation || null,
      });
      setSubmitted(true);
    } catch (submitError) {
      setError((submitError as Error).message);
    }
  };

  if (!reviewToken) {
    return <div className="min-h-screen bg-dark-500 px-4 pt-24 text-center text-white">Review link is missing.</div>;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark-500 px-4 pt-24">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/5 bg-dark-300 p-8 text-center">
          <CheckCircle size={36} className="mx-auto text-gold-400" />
          <h1 className="mt-4 text-3xl font-bold text-white">Thanks for the review</h1>
          <p className="mt-3 text-gray-400">Your feedback has been received and is now waiting for admin approval.</p>
          <button type="button" onClick={() => navigate("home")} className="mt-6 rounded-2xl bg-gradient-to-r from-gold-600 to-gold-400 px-6 py-3 font-semibold text-black">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-500 px-4 pt-24">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/5 bg-dark-300 p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Verified Customer Review</p>
        <h1 className="mt-3 text-3xl font-bold text-white">How did we do?</h1>
        <p className="mt-2 text-sm text-gray-400">
          Share feedback for order {review?.order_id ? review.order_id.slice(0, 8).toUpperCase() : "..."}.
        </p>

        <div className="mt-6 flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <button key={index} type="button" onClick={() => setRating(index + 1)} className="rounded-xl border border-white/10 p-3">
              <Star size={18} className={index < rating ? "fill-gold-400 text-gold-400" : "text-gray-600"} />
            </button>
          ))}
        </div>

        <input value={publicLocation} onChange={(event) => setPublicLocation(event.target.value)} placeholder="City or location (optional)" className="mt-6 w-full rounded-2xl border border-white/5 bg-dark-200 px-4 py-3 text-sm text-white" />
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={6} placeholder="Tell us about the quality, speed, and overall experience..." className="mt-4 w-full rounded-2xl border border-white/5 bg-dark-200 px-4 py-3 text-sm text-white" />

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button type="button" onClick={() => void handleSubmit()} className="mt-6 rounded-2xl bg-gradient-to-r from-gold-600 to-gold-400 px-6 py-3 font-semibold text-black">
          Submit Review
        </button>
      </div>
    </div>
  );
}
