import { useState, useEffect } from "react";
import { CameraOff, Settings, Keyboard, X, ArrowRight } from "lucide-react";
import { biya, font } from "../theme";
import { type Vendor, vendorIcons } from "../data";
import { supabase } from "../../../../lib/supabase";
import { normalizeVendorCode } from "../demoData";

export function CameraDeniedFallback({
  vendors,
  onClose,
  onVendorFound,
  startManual = false,
}: {
  vendors: Vendor[];
  onClose: () => void;
  onVendorFound: (vendor: Vendor) => void;
  startManual?: boolean;
}) {
  const [showManual, setShowManual] = useState(startManual);
  // Sync prop changes
  useEffect(() => {
    if (startManual) setShowManual(true);
  }, [startManual]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const normalizeManualCode = (value: string) => value.trim().replace(/\D/g, "");

  const handleSubmit = () => {
    const normalized = normalizeManualCode(code);
    if (normalized.length !== 10) {
      setError("Enter the full 10-digit vendor account number.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    (async () => {
      const found = vendors.find((v) => v.code === normalized);
      if (found) {
        onVendorFound(found);
        return;
      }

      // Query Supabase for the vendor if not present locally
      try {
        const { data, error } = await supabase.from("users").select("*").eq("type", "vendor").filter("details->>code", "eq", normalized).maybeSingle();
        if (!error && data) {
          const vendor: Vendor = {
            id: data.id,
            name: data.name,
            code: normalizeVendorCode(data.details?.code, false) || normalized,
            campus: data.details?.campus || "",
            icon: vendorIcons[data.name] ?? vendorIcons["Samaru Mart"],
          };
          onVendorFound(vendor);
          return;
        }
      } catch (e) {
        // ignore
      }

      setError("Vendor not found. Check the code and try again.");
      setTimeout(() => setError(""), 3000);
    })();
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: biya.cream }}
    >
      {/* Offline banner */}
      <div
        className="flex items-center justify-center gap-2 px-6 py-2"
        style={{ backgroundColor: biya.ink }}
      >
        <span
          style={{
            fontFamily: font.mono,
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "0.6px",
            color: "#fff",
          }}
        >
          CAMERA UNAVAILABLE
        </span>
      </div>

      {/* Close button */}
      <div className="px-6 pt-4">
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-full"
          style={{
            width: 40,
            height: 40,
            backgroundColor: biya.mute,
          }}
        >
          <X size={18} color={biya.ink} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {!showManual ? (
          /* Camera denied state */
          <>
            <span
              className="flex items-center justify-center rounded-[28px] mb-6"
              style={{
                width: 96,
                height: 96,
                backgroundColor: biya.muteAlt,
                border: `1px solid ${biya.line}`,
              }}
            >
              <CameraOff size={40} color={biya.gray} />
            </span>

            <h1
              style={{
                fontFamily: font.display,
                fontWeight: 700,
                fontSize: 24,
                color: biya.ink,
                textAlign: "center",
              }}
            >
              Camera access needed
            </h1>
            <p
              className="mt-2 text-center max-w-[280px]"
              style={{
                fontFamily: font.display,
                fontSize: 15,
                lineHeight: 1.5,
                color: biya.gray,
              }}
            >
              Biya needs your camera to scan vendor QR codes. You can also enter
              a 10-digit vendor account number manually.
            </p>
            <div className="mt-8 w-full flex flex-col gap-3">
              <button
                onClick={async () => {
                  // Try to trigger a permission prompt by requesting the camera
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    try {
                      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                      // Stop immediately - we only wanted to trigger permission
                      s.getTracks().forEach((t) => t.stop());
                      onClose();
                      return;
                    } catch (e) {
                      // Permission denied or error - fall through to show guidance
                    }
                  }
                  setError("Please enable camera permission in your browser settings and try again.");
                  setTimeout(() => setError(""), 4000);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-full transition-transform active:scale-[0.98]"
                style={{
                  height: 56,
                  backgroundColor: biya.marigold,
                }}
              >
                <Settings size={18} color={biya.goldDeep} />
                <span
                  style={{
                    fontFamily: font.display,
                    fontWeight: 700,
                    fontSize: 16,
                    color: biya.goldDeep,
                  }}
                >
                  Open Settings
                </span>
              </button>
              <button
                onClick={() => setShowManual(true)}
                className="w-full flex items-center justify-center gap-2 rounded-full transition-transform active:scale-[0.98]"
                style={{
                  height: 56,
                  backgroundColor: "#fff",
                  border: `1.5px solid ${biya.line}`,
                }}
              >
                <Keyboard size={18} color={biya.ink} />
                <span
                  style={{
                    fontFamily: font.display,
                    fontWeight: 700,
                    fontSize: 16,
                    color: biya.ink,
                  }}
                >
                  Enter account number manually
                </span>
              </button>
            </div>
          </>
        ) : (
          /* Manual code entry */
          <>
            <span
              className="flex items-center justify-center rounded-[28px] mb-6"
              style={{
                width: 96,
                height: 96,
                backgroundColor: biya.peach,
              }}
            >
              <Keyboard size={40} color={biya.gold} />
            </span>

            <h1
              style={{
                fontFamily: font.display,
                fontWeight: 700,
                fontSize: 24,
                color: biya.ink,
                textAlign: "center",
              }}
            >
              Enter vendor account number
            </h1>
            <p
              className="mt-2 text-center max-w-[280px]"
              style={{
                fontFamily: font.display,
                fontSize: 15,
                lineHeight: 1.5,
                color: biya.gray,
              }}
            >
              Ask the vendor for their 10-digit Biya account number, printed on their
              sticker.
            </p>

            <div className="w-full mt-8">
              <div
                className="flex items-center rounded-2xl bg-white px-5 py-4"
                style={{ border: `1px solid ${error ? biya.red : biya.line}` }}
              >
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setError("");
                  }}
                  placeholder="0000000000"
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full bg-transparent outline-none text-center"
                  style={{
                    fontFamily: font.mono,
                    fontSize: 32,
                    fontWeight: 700,
                    letterSpacing: "0.3em",
                    color: biya.ink,
                  }}
                />
              </div>
              {error && (
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: font.display,
                    fontSize: 13,
                    color: biya.red,
                  }}
                >
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={code.length < 10}
              className="w-full flex items-center justify-center gap-2 rounded-full transition-transform active:scale-[0.98] disabled:opacity-50 mt-6"
              style={{
                height: 56,
                backgroundColor: biya.marigold,
              }}
            >
              <span
                style={{
                  fontFamily: font.display,
                  fontWeight: 700,
                  fontSize: 16,
                  color: biya.goldDeep,
                }}
              >
                Find Vendor
              </span>
              <ArrowRight size={18} color={biya.goldDeep} />
            </button>

            <button
              onClick={() => {
                setShowManual(false);
                setCode("");
                setError("");
              }}
              className="mt-4"
            >
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 12,
                  letterSpacing: "0.6px",
                  color: biya.gray,
                }}
              >
                BACK
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
