import * as React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// Shared shell for every Jugnoo email. Future notification templates wrap their
// content in <EmailLayout> so the brand header/footer and base styles stay
// consistent across channels (ADR 0018).
export interface EmailLayoutProps {
  /** Inbox preview line (hidden in the body). */
  preview: string;
  children: React.ReactNode;
}

const BRAND = "#16a34a"; // Jugnoo green (firefly)

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={wordmark}>Jugnoo</Text>
          </Section>
          {children}
          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because you own a business on Jugnoo. Replies to
            this address aren't monitored.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  margin: 0,
  padding: "24px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  margin: "0 auto",
  maxWidth: 480,
  padding: "32px",
};

const header: React.CSSProperties = { paddingBottom: 8 };

const wordmark: React.CSSProperties = {
  color: BRAND,
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: "-0.01em",
  margin: 0,
};

const hr: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "28px 0 16px",
};

const footer: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 12,
  lineHeight: "18px",
  margin: 0,
};

export { BRAND };
