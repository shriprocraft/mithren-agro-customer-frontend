"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { BadgeCheck, MessageSquareReply, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBackendCustomerId, useOptionalAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api-client";
import { signInHref } from "@/lib/checkout-auth";
import { cn } from "@/lib/utils";
import { reviewsService as defaultService, type MyReview, type Review, type ReviewList, type ReviewsService } from "@/services/reviews";

const MAX_TITLE = 120;
const MAX_BODY = 2000;
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** Five stars filled to `value` (halves rounded), with the value as text for screen readers. */
export function Stars({ value, className }: { value: number; className?: string }) {
  const filled = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-4", n <= filled ? "fill-current text-warning" : "text-muted-foreground/40")} aria-hidden="true" />
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="text-sm font-medium">Your rating</legend>
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-full p-1 has-focus-visible:ring-2 has-focus-visible:ring-ring">
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
            <Star className={cn("size-7 transition-colors", n <= value ? "fill-current text-warning" : "text-muted-foreground/50 hover:text-warning")} aria-hidden="true" />
            <span className="sr-only">{plural(n, "star")}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={review.rating} />
        {review.title && <p className="font-medium">{review.title}</p>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {review.customer_name} · <time dateTime={review.created_at}>{dateFormat.format(new Date(review.created_at))}</time>
        {review.verified_purchase && (
          <span className="ml-2 inline-flex items-center gap-1 text-success"><BadgeCheck className="size-3.5" aria-hidden="true" />Verified purchase</span>
        )}
      </p>
      {review.body && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{review.body}</p>}
      {review.seller_reply && (
        <div className="mt-3 flex gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
          <MessageSquareReply className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p><span className="font-medium">Seller&rsquo;s reply: </span>{review.seller_reply}</p>
        </div>
      )}
    </li>
  );
}

function ReviewForm({ productId, mine, service, onSaved }: { productId: string; mine: MyReview; service: ReviewsService; onSaved: (mine: MyReview) => void }) {
  const [rating, setRating] = useState(mine.review?.rating ?? 0);
  const [title, setTitle] = useState(mine.review?.title ?? "");
  const [body, setBody] = useState(mine.review?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const editing = Boolean(mine.review);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (rating < 1) return setError("Choose a rating from 1 to 5 stars.");
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const result = await service.submit(productId, { rating, ...(title.trim() && { title: title.trim() }), ...(body.trim() && { body: body.trim() }) });
      onSaved(result);
      setSaved(result.status === "hidden" ? "Your review was updated. The seller has hidden it, so it isn’t shown publicly." : editing ? "Your review was updated." : "Thank you! Your review is published.");
    } catch (e) {
      setError(e instanceof ApiError && e.status !== null && e.status < 500 && e.message ? e.message : "Your review couldn’t be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="surface-card space-y-3 rounded-3xl p-4 sm:p-5" aria-labelledby="review-form-title">
      <h3 id="review-form-title" className="font-heading text-base font-semibold">{editing ? "Edit your review" : "Write a review"}</h3>
      <StarPicker value={rating} onChange={setRating} />
      <label className="block text-sm font-medium">
        Title <span className="font-normal text-muted-foreground">(optional)</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={MAX_TITLE}
          className="mt-1 block h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </label>
      <label className="block text-sm font-medium">
        Your review <span className="font-normal text-muted-foreground">(optional)</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={MAX_BODY} rows={4}
          className="mt-1 block w-full rounded-xl border border-input bg-background p-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        <span className="mt-1 block text-right text-xs font-normal text-muted-foreground">{body.length}/{MAX_BODY}</span>
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {saved && <p role="status" className="text-sm text-success">{saved}</p>}
      <Button type="submit" loading={busy}>{editing ? "Update review" : "Submit review"}</Button>
    </form>
  );
}

/**
 * The product page's reviews: the average, how many gave each rating, the published reviews, and a
 * form for a signed-in customer who ordered the product (writing again edits their review).
 */
export function ProductReviews({ productId, service = defaultService }: { productId: string; service?: ReviewsService | null }) {
  const auth = useOptionalAuth();
  const customerId = useBackendCustomerId();
  const [list, setList] = useState<{ id: string; data: ReviewList | null; failed: boolean } | null>(null);
  const [mine, setMine] = useState<{ key: string; data: MyReview | null } | null>(null);

  const load = useCallback(() => {
    if (!service) return;
    service.list(productId).then(
      (data) => setList({ id: productId, data, failed: false }),
      () => setList({ id: productId, data: null, failed: true }),
    );
  }, [productId, service]);

  useEffect(load, [load]);
  useEffect(() => {
    if (!service || !customerId) return;
    let active = true;
    const key = `${customerId}:${productId}`;
    service.mine(productId).then(
      (data) => active && setMine({ key, data }),
      () => active && setMine({ key, data: null }),
    );
    return () => {
      active = false;
    };
  }, [service, customerId, productId]);

  const current = list?.id === productId ? list : null;
  // Opened at #reviews (e.g. "Write a review" on an order): the browser jumps there before the reviews
  // (and the customer's own) have loaded, while the section is still short, so it can land past it. Once
  // they are in, bring the section to the top, once per product.
  const ready = Boolean(current) && (!customerId || mine?.key === `${customerId}:${productId}`);
  const scrolledFor = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || scrolledFor.current === productId || window.location.hash !== "#reviews") return;
    scrolledFor.current = productId;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => document.getElementById("reviews")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }));
  }, [ready, productId]);

  if (!service) return null;
  const myReview = customerId && mine?.key === `${customerId}:${productId}` ? mine.data : null;
  const summary = current?.data;
  const here = `/products/${productId}#reviews`;

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="mt-12 scroll-mt-24 border-t border-border pt-8 sm:mt-14">
      <h2 id="reviews-title" className="font-heading text-xl font-semibold">Customer reviews</h2>
      <div className="mt-4 grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="space-y-4">
          {!current ? (
            <p role="status" className="text-sm text-muted-foreground">Loading reviews…</p>
          ) : current.failed ? (
            <p role="alert" className="text-sm text-destructive">Reviews couldn’t be loaded. Please try again later.</p>
          ) : summary && summary.review_count > 0 && summary.average_rating !== undefined ? (
            <div>
              <p className="flex items-center gap-2"><Stars value={summary.average_rating} className="[&_svg]:size-5" />
                <span className="font-heading text-lg font-semibold">{summary.average_rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">out of 5</span></p>
              <p className="mt-1 text-sm text-muted-foreground">{plural(summary.review_count, "review")}</p>
              <dl className="mt-3 space-y-1">
                {["5", "4", "3", "2", "1"].map((stars) => {
                  const count = summary.rating_counts[stars] ?? 0;
                  return (
                    <div key={stars} className="flex items-center gap-2 text-xs">
                      <dt className="w-12 shrink-0">{plural(Number(stars), "star")}</dt>
                      <dd className="flex flex-1 items-center gap-2">
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                          <span className="block h-full rounded-full bg-warning" style={{ width: `${(count / summary.review_count) * 100}%` }} />
                        </span>
                        <span className="w-6 text-right tabular-nums">{count}</span>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}

          {auth?.status === "loading" ? null : !customerId ? (
            <p className="text-sm">
              <Link href={signInHref(here)} className="font-medium text-primary underline-offset-4 hover:underline">Sign in</Link> to review a product you’ve ordered.
            </p>
          ) : myReview && !myReview.can_review ? (
            <p className="text-sm text-muted-foreground">You can review this product once you’ve ordered it.</p>
          ) : null}
        </div>

        <div className="min-w-0 space-y-6">
          {myReview?.can_review && service && (
            <ReviewForm key={productId} productId={productId} mine={myReview} service={service}
              onSaved={(saved) => { setMine({ key: `${customerId}:${productId}`, data: saved }); load(); }} />
          )}
          {summary && summary.reviews.length > 0 && (
            <ul className="divide-y divide-border" aria-label="Reviews">
              {summary.reviews.map((review) => <ReviewItem key={review.id} review={review} />)}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
