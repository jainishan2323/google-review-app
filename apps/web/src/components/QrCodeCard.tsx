"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  formUrl: string;
}

const QR_SIZE = 192;
const QR_PADDING = 12; // white quiet zone around the code, applied to both exports

// Wrap the rendered <svg> in a padded white canvas so the export has a printable
// quiet zone. Returns a standalone, serialisable SVG string.
function buildPaddedSvg(svg: SVGSVGElement): string {
  const inner = new XMLSerializer().serializeToString(svg);
  const total = QR_SIZE + QR_PADDING * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}"><rect width="${total}" height="${total}" fill="#ffffff"/><g transform="translate(${QR_PADDING},${QR_PADDING})">${inner}</g></svg>`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function QrCodeCard({ formUrl }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  function downloadAsSvg() {
    const svg = svgRef.current;
    if (!svg) return;
    const blob = new Blob([buildPaddedSvg(svg)], { type: "image/svg+xml;charset=utf-8" });
    triggerDownload(blob, "review-qr-code.svg");
  }

  function downloadAsPng() {
    const svg = svgRef.current;
    if (!svg) return;

    const svgBlob = new Blob([buildPaddedSvg(svg)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const total = QR_SIZE + QR_PADDING * 2;
      const canvas = document.createElement("canvas");
      canvas.width = total;
      canvas.height = total;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, "review-qr-code.png");
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

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="outline" className="gap-2" onClick={downloadAsPng}>
            <Download className="size-4" />
            Download PNG
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={downloadAsSvg}>
            <Download className="size-4" />
            Download SVG
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
