export default function ReviewsPage() {
  return (
    <main className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Reviews</h1>
      <p className="text-sm text-gray-500">
        Your Google reviews will appear here. Use the API route{" "}
        <code className="rounded bg-gray-100 px-1 text-xs">/api/reviews</code>{" "}
        to sync from Google Business Profile.
      </p>
    </main>
  );
}
