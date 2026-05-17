/**
 * Maps each known feedback tag to one of three operational zones.
 * Tags not present here are excluded from the Operational Zones chart.
 */
export const ZONE_MAP: Record<string, string> = {
  // Kitchen
  "Great Food": "Kitchen",
  "Good Value": "Kitchen",
  "Overpriced": "Kitchen",

  // Front of House
  "Great Service": "Front of House",
  "Friendly Staff": "Front of House",
  "Fast Service": "Front of House",
  "Long Wait": "Front of House",
  "Poor Communication": "Front of House",
  "Unprofessional": "Front of House",

  // Atmosphere
  "Clean Environment": "Atmosphere",
  "Noisy": "Atmosphere",
  "Highly Recommend": "Atmosphere",
  "Needs Improvement": "Atmosphere",
};

export const ZONE_ORDER = ["Kitchen", "Front of House", "Atmosphere"] as const;

/**
 * Mock delta values for each tag (percentage change vs previous period).
 * Positive = increasing (bad for negative tags, good for positive).
 * Negative = decreasing.
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
