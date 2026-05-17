/**
 * Mock delta values for each tag (percentage change vs previous period).
 * Positive = increasing (bad for negative tags, good for positive).
 * Negative = decreasing.
 * These are mocked — real period-over-period computation is deferred.
 */
export const MOCK_DELTAS: Record<string, number> = {
  "Great Food": -8,
  "Good Value": 12,
  "Overpriced": 18,
  "Great Service": -15,
  "Friendly Staff": -5,
  "Fast Service": -22,
  "Long Wait": 10,
  "Poor Communication": 7,
  "Unprofessional": -30,
  "Clean Environment": -10,
  "Noisy": 5,
  "Highly Recommend": -18,
  "Needs Improvement": 3,
};
