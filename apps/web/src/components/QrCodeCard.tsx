"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  formUrl: string;
}

export function QrCodeCard({ formUrl }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  function downloadAsPng() {
    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const padding = 32;
      const size = img.width + padding * 2;

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // White background so QR is printable on any surface
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, padding, padding);

      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "review-qr-code.png";
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };

    img.src = url;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your QR Code</CardTitle>
        <p className="text-sm text-muted-foreground">
          Print this on table tents or receipts. Customers scan it to leave a review.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-border">
          <QRCode
            // @ts-expect-error — react-qr-code passes ref via forwardRef to the underlying <svg>
            ref={svgRef}
            value={formUrl}
            size={192}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
          />
        </div>

        <a
          href={formUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground break-all text-center max-w-xs hover:text-foreground transition-colors underline underline-offset-2"
        >
          {formUrl}
        </a>

        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={downloadAsPng}
        >
          <Download className="size-4" />
          Download QR Code
        </Button>
      </CardContent>
    </Card>
  );
}
