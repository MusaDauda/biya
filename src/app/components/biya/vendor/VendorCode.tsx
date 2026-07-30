import { useEffect } from "react";
import { Download, Clipboard } from "lucide-react";
import { toast } from "sonner";
import { renderToString } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import { biya, font } from "../theme";
import { QRCode } from "./QRCode";
import type { VendorProfile } from "../data";

function renderQRCodeSvg(seed: string, size: number) {
  return renderToString(
    <QRCodeSVG
      value={seed}
      size={size}
      bgColor="#ffffff"
      fgColor={biya.ink}
      level="Q"
    />
  );
}

export function VendorCode({ vendorProfile }: { vendorProfile: VendorProfile }) {
  const shareText = `Pay ${vendorProfile.name} on Biya using account number ${vendorProfile.details.code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Payment details copied to clipboard.");
    } catch {
      window.prompt("Copy this text to share:", shareText);
    }
  };

  const handlePrint = () => {
    const title = `${vendorProfile.name} — Biya QR Code`;
    const svg = renderQRCodeSvg(vendorProfile.details.code, 260);
    const printWindow = window.open("", "_blank", "width=820,height=960");

    if (!printWindow) {
      toast.error("Unable to open print preview. Try allowing popups.");
      return;
    }

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { margin: 0; padding: 32px; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #111827; }
            .page { max-width: 520px; margin: 0 auto; }
            .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 32px; padding: 32px; box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08); }
            .brand { display: inline-block; margin-bottom: 16px; color: ${biya.gold}; letter-spacing: 0.2em; font-weight: 800; font-size: 13px; text-transform: uppercase; }
            .heading { margin: 0 0 12px; font-size: 28px; font-weight: 800; line-height: 1.05; }
            .campus { margin: 0 0 24px; color: #6b7280; font-size: 13px; letter-spacing: 0.03em; text-transform: uppercase; }
            .info { margin: 24px 0 0; }
            .info-label { margin: 0 0 8px; font-size: 10px; letter-spacing: 0.28em; color: #9ca3af; text-transform: uppercase; }
            .info-value { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.28em; color: #111827; }
            .actions { display: flex; flex-direction: column; gap: 12px; margin-top: 28px; }
            .print-button { background: #0b1124; color: #fff; border: none; border-radius: 999px; padding: 14px 18px; font-size: 14px; font-weight: 700; cursor: pointer; }
            .hint { margin: 0; color: #475569; font-size: 13px; line-height: 1.5; }
            @media print { .actions { display: none; } body { background: #fff; } .page { box-shadow: none; } }
          </style>
        </head>
        <body onload="window.focus(); window.print();">
          <div class="page">
            <div class="card">
              <div class="brand">Biya</div>
              <h1 class="heading">${vendorProfile.name}</h1>
              <p class="campus">${vendorProfile.details.campus}</p>
              <div style="margin: 26px auto; width: fit-content; background: #fff; padding: 16px; border-radius: 32px; border: 1px solid #e2e8f0;">
                ${svg}
              </div>
              <div class="info">
                <p class="info-label">Account number</p>
                <p class="info-value">${vendorProfile.details.code}</p>
              </div>
              <div class="actions">
                <button class="print-button" onclick="window.focus(); window.print();">Print or Save as PDF</button>
                <p class="hint">If the print dialog does not appear automatically, use this button instead.</p>
              </div>
            </div>
          </div>
        </body>
      </html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    toast.success("Print preview opened. Click the button to print or save as PDF.");
  };

  return (
    <div className="h-full overflow-y-auto pb-32 flex flex-col" style={{ backgroundColor: biya.cream }}>
      <header className="px-6 pt-8 pb-2">
        <h1 style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, color: biya.ink }}>Your account number</h1>
        <p style={{ fontFamily: font.display, fontSize: 14, color: biya.gray }}>Students scan this QR code or enter your account number</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="rounded-[36px] bg-white p-8 flex flex-col items-center w-full max-w-[320px]" style={{ border: `1px solid ${biya.line}`, boxShadow: "0px 24px 48px rgba(0,0,0,0.07)" }}>
          <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 24, color: biya.gold }}>Biya</span>
          <p className="mb-5" style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "1.4px", color: biya.gray, textTransform: "uppercase" }}>SCAN TO PAY</p>

          <div className="mb-6 rounded-3xl overflow-hidden" style={{ backgroundColor: "#fff", border: `1px solid ${biya.line}` }}>
            <QRCode seed={vendorProfile.details.code} size={220} />
          </div>

          <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: biya.ink, marginBottom: 4 }}>{vendorProfile.name}</p>
          <p style={{ fontFamily: font.mono, fontSize: 12, color: biya.gray, letterSpacing: "0.08em", textTransform: "uppercase" }}>{vendorProfile.details.campus}</p>

          <div className="mt-6 w-full rounded-[28px] bg-[#f2f4f6] py-4 px-5" style={{ border: `1px solid ${biya.line}` }}>
            <p style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: biya.gray, marginBottom: 8 }}>ACCOUNT NUMBER</p>
            <p style={{ fontFamily: font.mono, fontSize: 22, fontWeight: 700, letterSpacing: "0.3em", color: biya.ink, margin: 0 }}>{vendorProfile.details.code}</p>
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-[320px] mt-5">
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 rounded-full py-4 transition-transform active:scale-[0.98]" style={{ backgroundColor: biya.ink }}>
            <Download size={16} color="#fff" />
            <span style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", color: "#fff" }}>PRINT QR CODE</span>
          </button>

          <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 rounded-full py-4 transition-transform active:scale-[0.98]" style={{ backgroundColor: biya.mute }}>
            <Clipboard size={16} color={biya.ink} />
            <span style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", color: biya.ink }}>COPY DETAILS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
