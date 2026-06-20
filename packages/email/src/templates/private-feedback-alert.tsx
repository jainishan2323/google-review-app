import * as React from "react";
import { Button, Heading, Section, Text } from "@react-email/components";
import { BRAND, EmailLayout } from "../layout";

// Sent to the Owner when a customer leaves PRIVATE feedback (source=private) —
// the rating-<4 path that never reaches Google (ADR 0018).
//
// Deliberately detail-free: only the star rating + a dashboard CTA. The actual
// comment/chips are withheld so the Owner must log in to read them — the hook
// for the planned feedback monetization. Richer content returns with that work.
export interface PrivateFeedbackAlertProps {
  businessName: string;
  rating: number; // 1–5
  dashboardUrl: string; // deep link to the dashboard feedback view
}

export function PrivateFeedbackAlertEmail({
  businessName,
  rating,
  dashboardUrl,
}: PrivateFeedbackAlertProps) {
  const stars = "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));

  return (
    <EmailLayout preview={`New private feedback for ${businessName} — ${rating}★`}>
      <Heading style={heading}>New private feedback</Heading>
      <Text style={subhead}>
        A customer left feedback for <strong>{businessName}</strong>. It was kept
        private and <strong>not posted to Google</strong>.
      </Text>

      <Section style={card}>
        <Text style={starsStyle}>
          {stars} <span style={ratingNum}>{rating}/5</span>
        </Text>
        <Text style={detailHint}>Open your dashboard to read the full feedback.</Text>
      </Section>

      <Section style={{ textAlign: "center", paddingTop: 8 }}>
        <Button href={dashboardUrl} style={button}>
          View in dashboard
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default PrivateFeedbackAlertEmail;

const heading: React.CSSProperties = {
  color: "#18181b",
  fontSize: 22,
  fontWeight: 700,
  margin: "8px 0 4px",
};

const subhead: React.CSSProperties = {
  color: "#52525b",
  fontSize: 14,
  lineHeight: "21px",
  margin: "0 0 20px",
};

const card: React.CSSProperties = {
  backgroundColor: "#fafafa",
  border: "1px solid #e4e4e7",
  borderRadius: 10,
  padding: "20px",
  textAlign: "center",
};

const starsStyle: React.CSSProperties = {
  color: "#f59e0b",
  fontSize: 26,
  letterSpacing: 2,
  margin: "0 0 8px",
};

const ratingNum: React.CSSProperties = {
  color: "#71717a",
  fontSize: 15,
  fontWeight: 600,
};

const detailHint: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 13,
  margin: 0,
};

const button: React.CSSProperties = {
  backgroundColor: BRAND,
  borderRadius: 8,
  color: "#ffffff",
  display: "inline-block",
  fontSize: 15,
  fontWeight: 600,
  padding: "12px 28px",
  textDecoration: "none",
};
