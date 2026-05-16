export default function AnalyticsPage() {
  return (
    <main className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Analytics</h1>
      <p className="text-sm text-gray-500">
        Rating trends and AI sentiment analysis will appear here. Use the API
        route{" "}
        <code className="rounded bg-gray-100 px-1 text-xs">
          /api/analytics/sentiment
        </code>{" "}
        to run an analysis.
      </p>
    </main>
  );
}
